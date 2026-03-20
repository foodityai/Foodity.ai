export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      reply: "GET working 🚀"
    });
  }

  if (req.method === "POST") {
    try {
      const { message } = req.body;

      return res.status(200).json({
        reply: "You said: " + message
      });
    } catch (err) {
      return res.status(500).json({
        error: "Server error"
      });
    }
  }

  return res.status(405).json({
    error: "Method not allowed"
  });
}
