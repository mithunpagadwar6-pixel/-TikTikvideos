import admin from "firebase-admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    const bucket = admin.storage().bucket();
    const fileName = `livestreams/${Date.now()}_${userId}.webm`;

    const file = bucket.file(fileName);
    const buffer = Buffer.from(req.body);

    await file.save(buffer, { contentType: "video/webm" });

    res.json({ success: true, url: file.publicUrl() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
