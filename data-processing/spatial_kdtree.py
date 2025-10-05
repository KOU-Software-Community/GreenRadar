import pandas as pd
import numpy as np
from scipy.spatial import cKDTree

GRID_SIZE = 0.01  # 1.1km approx

PARAM_CONFIG = {
    "NDVI_Value": {
        "spatial_tol": 0.02,  # 2km
        "temporal_tol": 8,  # 8d
        "is_annual": False,
    },
    "NPP_kgCm2perYear": {
        "spatial_tol": 0.02,
        "temporal_tol": 365,
        "is_annual": True,
    },
    "LandCover_Type": {
        "spatial_tol": 0.02,  # 2km
        "temporal_tol": 365,
        "is_annual": True,
        "is_categorical": True,
    },
    "TreeCover_Percent": {"spatial_tol": 0.05, "temporal_tol": 365, "is_annual": True},
}


def round_to_grid(value, grid_size):
    return np.round(value / grid_size) * grid_size


def normalize_csv(
    filepath,
    value_column,
    has_header=True,
    valid_range=None,
    fill_values=None,
    is_categorical=False,
):
    if has_header:
        df = pd.read_csv(filepath)
    else:
        df = pd.read_csv(
            filepath, names=["date", "longitude", "latitude", value_column]
        )

    print(f"\n{filepath} yüklendi: {len(df)} satır")
    print(f"Tarih aralığı: {df['date'].min()} - {df['date'].max()}")

    # clean fill value
    if fill_values:
        for fv in fill_values:
            df.loc[df[value_column] == fv, value_column] = np.nan
        print(f"Fill value'lar temizlendi: {fill_values}")

    # clean out range
    if valid_range:
        min_val, max_val = valid_range
        invalid_count = (
            (df[value_column] < min_val) | (df[value_column] > max_val)
        ).sum()
        df.loc[
            (df[value_column] < min_val) | (df[value_column] > max_val), value_column
        ] = np.nan
        if invalid_count > 0:
            print(
                f"Geçersiz aralık dışı {invalid_count} değer temizlendi (valid: {min_val} - {max_val})"
            )

    df["date"] = pd.to_datetime(df["date"])

    df["lon_grid"] = round_to_grid(df["longitude"], GRID_SIZE)
    df["lat_grid"] = round_to_grid(df["latitude"], GRID_SIZE)

    if is_categorical:
        df_grouped = (
            df.groupby(["date", "lon_grid", "lat_grid"])[value_column]
            .agg(lambda x: x.mode()[0] if len(x.mode()) > 0 else x.iloc[0])
            .reset_index()
        )
        print(f"Kategorik veri: Mode (en sık değer) kullanıldı")
    else:
        df_grouped = (
            df.groupby(["date", "lon_grid", "lat_grid"])
            .agg({value_column: "mean"})
            .reset_index()
        )

    df_grouped.columns = ["date", "longitude", "latitude", value_column]

    df_grouped = df_grouped.dropna(subset=[value_column])

    print(f"Grid normalizasyonundan sonra: {len(df_grouped)} satır")
    print(
        f"Benzersiz konum sayısı: {len(df_grouped.groupby(['longitude', 'latitude']))}"
    )
    print(f"Benzersiz tarih sayısı: {df_grouped['date'].nunique()}")

    return df_grouped


def spatial_temporal_match(base_df, other_df, other_column, config):
    spatial_tol = config["spatial_tol"]
    temporal_tol = config["temporal_tol"]
    is_annual = config["is_annual"]
    is_categorical = config.get("is_categorical", False)

    print(f"\n{other_column} eşleştiriliyor...")
    print(f"  Spatial tolerance: ±{spatial_tol}° (~{spatial_tol * 111:.1f} km)")
    print(f"  Temporal tolerance: ±{temporal_tol} gün")
    print(f"  Yıllık veri: {'Evet' if is_annual else 'Hayır'}")
    print(f"  Kategorik veri: {'Evet' if is_categorical else 'Hayır'}")

    base_2024 = base_df[base_df["date"].dt.year == 2024].copy()
    other_2024 = other_df[other_df["date"].dt.year == 2024].copy()

    if is_annual:
        other_unique = (
            other_2024.groupby(["longitude", "latitude"]).first().reset_index()
        )
        print(f"  Other dataset: {len(other_unique)} benzersiz lokasyon")

        unique_locations = base_2024[["longitude", "latitude"]].drop_duplicates()
        print(f"  Base dataset: {len(unique_locations)} benzersiz lokasyon")

        # kdtree spatial
        base_coords = unique_locations[["longitude", "latitude"]].values
        other_coords = other_unique[["longitude", "latitude"]].values

        tree = cKDTree(other_coords)

        if is_categorical:
            distances, indices = tree.query(
                base_coords, distance_upper_bound=spatial_tol
            )
            print(
                f"  Kategorik veri: En yakın grid hücresi kullanılıyor (max {spatial_tol * 111:.1f}km)"
            )
        else:
            distances, indices = tree.query(
                base_coords, distance_upper_bound=spatial_tol
            )

        location_values = {}
        valid_matches = distances != np.inf
        matched_indices = np.where(valid_matches)[0]

        for i, base_idx in enumerate(matched_indices):
            lon, lat = unique_locations.iloc[base_idx][["longitude", "latitude"]].values
            other_idx = indices[base_idx]
            val = other_unique.iloc[other_idx][other_column]
            location_values[(lon, lat)] = val

        print(f"  Eşleşen lokasyonlar: {len(location_values)}/{len(unique_locations)}")

        base_2024[other_column] = base_2024.apply(
            lambda row: location_values.get(
                (row["longitude"], row["latitude"]), np.nan
            ),
            axis=1,
        )

        matched_count = base_2024[other_column].notna().sum()
        match_rate = (matched_count / len(base_2024)) * 100
        print(
            f"  ✓ {matched_count}/{len(base_2024)} satır dolduruldu ({match_rate:.1f}%)"
        )

    else:
        # temporal spatial
        base_2024["days"] = (base_2024["date"] - pd.Timestamp("2024-01-01")).dt.days
        other_2024["days"] = (other_2024["date"] - pd.Timestamp("2024-01-01")).dt.days

        TIME_SCALE = 0.01  # 1 day = 0.01 deg approx

        base_coords = np.column_stack(
            [
                base_2024["longitude"].values,
                base_2024["latitude"].values,
                base_2024["days"].values * TIME_SCALE,
            ]
        )

        other_coords = np.column_stack(
            [
                other_2024["longitude"].values,
                other_2024["latitude"].values,
                other_2024["days"].values * TIME_SCALE,
            ]
        )

        tree = cKDTree(other_coords)

        # closes other point within tolerance
        max_distance = np.sqrt(spatial_tol**2 + (temporal_tol * TIME_SCALE) ** 2)
        distances, indices = tree.query(base_coords, distance_upper_bound=max_distance)

        base_2024[other_column] = np.nan
        valid_matches = distances != np.inf
        base_2024.loc[valid_matches, other_column] = other_2024.iloc[
            indices[valid_matches]
        ][other_column].values

        matched_count = valid_matches.sum()
        match_rate = (matched_count / len(base_2024)) * 100
        print(f"  ✓ {matched_count}/{len(base_2024)} satır eşleşti ({match_rate:.1f}%)")

        base_2024 = base_2024.drop(columns=["days"])

    return base_2024


lst_file = "all_LST_data.csv"
ndvi_file = "all_NDVI_data.csv"
npp_file = "all_NPP_data.csv"
landcover_file = "all_LandCover_data.csv"
treecover_file = "all_TreeCover_data.csv"

print("CSV SPATIAL-TEMPORAL MATCHING")
print(f"Grid boyutu: {GRID_SIZE}° (~{GRID_SIZE * 111:.1f} km)")
print("=" * 60)

print("\n[1/6] CSV dosyaları yükleniyor ve normalize ediliyor...")

lst_df = normalize_csv(lst_file, "LST_Celsius", has_header=True, valid_range=(-50, 60))

ndvi_df = normalize_csv(
    ndvi_file,
    "NDVI_Value",
    has_header=True,
    valid_range=(-1, 1),
    fill_values=[6.5535, 65535, -9999],
)

npp_df = normalize_csv(
    npp_file,
    "NPP_kgCm2perYear",
    has_header=True,
    valid_range=(0, 10),
    fill_values=[3.2767, -9999, 65535],
)

landcover_df = normalize_csv(
    landcover_file, "LandCover_Type", has_header=True, is_categorical=True
)  # categorical

treecover_df = normalize_csv(
    treecover_file,
    "TreeCover_Percent",
    has_header=True,
    valid_range=(0, 100),
    fill_values=[-999, -9999],
)

print("\n[2/6] Spatial-temporal matching başlıyor...")
merged_df = lst_df[lst_df["date"].dt.year == 2024].copy()
print(f"Base dataset (LST 2024): {len(merged_df)} satır")

print("\n[3/6] NDVI eşleştiriliyor...")
merged_df = spatial_temporal_match(
    merged_df, ndvi_df, "NDVI_Value", PARAM_CONFIG["NDVI_Value"]
)

print("\n[4/6] NPP eşleştiriliyor...")
merged_df = spatial_temporal_match(
    merged_df, npp_df, "NPP_kgCm2perYear", PARAM_CONFIG["NPP_kgCm2perYear"]
)

print("\n[5/6] LandCover eşleştiriliyor...")
merged_df = spatial_temporal_match(
    merged_df, landcover_df, "LandCover_Type", PARAM_CONFIG["LandCover_Type"]
)

print("\n[6/6] TreeCover eşleştiriliyor...")
merged_df = spatial_temporal_match(
    merged_df, treecover_df, "TreeCover_Percent", PARAM_CONFIG["TreeCover_Percent"]
)

print("FİNAL TEMİZLEME")
print("=" * 60)
value_columns = [
    "LST_Celsius",
    "NDVI_Value",
    "NPP_kgCm2perYear",
    "LandCover_Type",
    "TreeCover_Percent",
]
before_drop = len(merged_df)
merged_df = merged_df.dropna(subset=value_columns, how="all")
dropped_rows = before_drop - len(merged_df)
print(f"Tamamen boş satırlar silindi: {dropped_rows}")
print(f"Kalan satır sayısı: {len(merged_df)}")

print("\n" + "=" * 60)
print("ÖZET İSTATİSTİKLER")
print("=" * 60)
print(f"Toplam satır: {len(merged_df)}")
print(f"Tarih aralığı: {merged_df['date'].min()} - {merged_df['date'].max()}")
print(f"Benzersiz tarih: {merged_df['date'].nunique()}")
print(f"Benzersiz konum: {len(merged_df.groupby(['longitude', 'latitude']))}")

print(f"\nVeri doluluğu:")
for col in value_columns:
    filled_pct = (merged_df[col].notna().sum() / len(merged_df)) * 100
    print(f"  {col}: {filled_pct:.1f}% dolu")

param_counts = merged_df[value_columns].notna().sum(axis=1)
print(f"\nParametre dağılımı:")
for i in range(1, 6):
    count = (param_counts == i).sum()
    pct = (count / len(merged_df)) * 100
    print(f"  {i} parametre: {count} satır ({pct:.1f}%)")

# filled rows
full_rows = merged_df[param_counts == 5]
print(f"\n🎉 TÜM PARAMETRELERİ DOLU SATIRLAR: {len(full_rows)}")

output_file = "formulization_data_final.csv"
merged_df.to_csv(output_file, index=False)
print(f"\n✓ Birleştirilmiş veri kaydedildi: {output_file}")

if len(full_rows) > 0:
    print("\n" + "=" * 60)
    print("TAM DOLU İLK 5 SATIR")
    print("=" * 60)
    print(full_rows.head(5).to_string())

print("\n" + "=" * 60)
print("TAMAMLANDI!")
print("=" * 60)
