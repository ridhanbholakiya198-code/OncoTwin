export default function handler(_req: any, res: any) {
  res.status(200).json({
    defaultProvider:
      process.env.DEFAULT_AI_PROVIDER ||
      ((process.env.GEMINI_API_KEY || process.env.DEFAULT_GEMINI_API_KEY)
        ? "gemini"
        : "claude"),
  });
}
