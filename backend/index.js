import express from "express"
import cors from "cors"
import { llmPipeline } from "./llmPipe.js"
import bodyParser from "body-parser";
import { collectData } from "./dataPrep.js";
import path from "path";
import { flattenData } from "./dataPrep.js";


const PORT = 5000;

const corsOption = {
    origin: "*",
    credentials: true,
}


const app = express();


app.use(cors(corsOption));
app.use(bodyParser.json());

app.post("/:type/:date", async (req, res) => {
    const type = req.params.type;
    const date = req.params.date;
    const obj = req.body;
    console.log(obj);
    if (!type || !date || !obj) {
        res.sendStatus(400);
    }

    const ret = await collectData(date, obj, type);
    res.json(ret);
});

app.post("/advice", async (req, res) => {
    let obj = req.body;
    obj = flattenData(obj);
    const result = await llmPipeline(obj);
    res.json(result);
})

app.get("/downland/:filePath", (req, res) => {
    res.download(path.join(__dirname, "/datas/", req.params.filePath));
})

app.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
})
