import fs from "fs";
import OsuParser from "osu-json-parser";
import readline from "readline";
import parseRGB from "./parseRGB";

const rl = readline.createInterface({
  input: fs.createReadStream(
    // "data/cosMo@BousouP feat.Hatsune Miku - Hatsune Miku no Shoushitsu (val0108) [Extra].osu",
    // "data/Omoi - Teo (Kroytz) [Motto!].osu",
    "data/Dark PHOENiX - Stirring an Autumn Moon (_lolipop) [Crazy Moon].osu",
  ),
});

const parser = new OsuParser();

rl.on("line", (line) => {
  parser.parse(line);
});

rl.on("close", () => {
  const scripts = parseRGB(parser.toJSON());
  fs.writeFileSync("result.txt", scripts.join("\n"));
  console.log(scripts);
  // fs.writeFileSync("result.json", JSON.stringify(parser.toJSON(), null, 2));
});
