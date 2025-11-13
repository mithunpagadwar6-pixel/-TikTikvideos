import formidable from "formidable";
import fs from "fs";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase.js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Only POST allowed" });

  const form = formidable({ multiples: false, uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: "Upload error" });

    const file = files.live;
    const data = fs.readFileSync(file.filepath);
    const storageRef = ref(storage, `live/${file.originalFilename}`);
    await uploadBytes(storageRef, data);
    const url = await getDownloadURL(storageRef);

    res.status(200).json({ ok: true, url });
  });
}
