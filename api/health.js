export default function handler(req, res) {
  res.status(200).json({ status: "ok", service: "Foodity AI Serverless API" });
}
