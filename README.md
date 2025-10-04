# Green Radar

### Data-Driven Green Space Management Project

## Team Name :
Apollo 13.1

## 🚀 About The Project

Our AI-powered web app, created for the NASA Space Apps Challenge, generates actionable afforestation reports for user-selected regions. Serving stakeholders like municipalities and NGOs, it directly supports key unsustainable Development Goals, including Climate Action and Sustainable Cities. Our prototype for Kocaeli, Turkey, transforms complex data into concrete strategies for a greener future.

## 🎯 Key Benefits

### Faster, cheaper decision making: 
Pinpoints highest-value planting sites so municipalities and NGOs allocate crews and budget efficiently.

### Transparent & communicable reports: 
LLM-generated plain-language summaries help non-technical stakeholders and the public understand rationale and benefits.

### Temporal flexibility: 

The date slider enables monitoring and change detection for 2024 (daily → yearly), so users can assess seasonality and post-disturbance windows.

### Scalable workflow: 

Pipeline is portable (CSV storage + containerized processing) and can be applied to other cities/regions.

## Tools, Languages & Software Used

- ### Frontend:
React (single-page app), map integration (Leaflet), UI components (React + CSS/Tailwind).
Leaflet for interactive maps

- ### Backend:
Node.js + Express serving APIs and CSV assets and request handling.
Data persisted as CSV files on the backend (schema described below).

- ### LLM/Natural Language:
Gemini 2.5 Flash via FAL for human-readable report generation (LLM requests handled server-side; team used available credits from another project).

- ### Data & Processing (Python):
Rasterio - raster I/O & windowed processing.
GeoPandas - vector processing, clipping, spatial joins
NumPy / pandas - numerical ops, resampling, CSV conversion.
Scipy - Data interpolation and generalization

## NASA data used

- MODIS/Terra Vegetation Indices 16-Day L3 Global 1km SIN Grid V061
- MODIS/Terra Net Primary Production Gap-Filled Yearly L4 Global 500m SIN Grid V061
- MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1km SIN Grid V061
- MODIS/Terra Vegetation Continuous Fields Yearly L3 Global 250m SIN Grid V061
- MODIS/Terra+Aqua Land Cover Type Yearly L3 Global 500m SIN Grid V061

## Future Work
Next steps that can be built upon this 48-hour prototype:

### Map Expansion: 
Enhancing the current map view and scaling it up to cover larger areas.

### Data Integration: 
Combining socio-economic and environmental data to enable more comprehensive analyses.

### Improved User Engagement: 
Making the application more interactive and engaging for users.
