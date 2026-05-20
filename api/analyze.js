// api/analyze.js 안에는 이 코드만 딱 들어가야 합니다!
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  const API_KEY = process.env.ANTHROPIC_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ message: '서버에 AI 인증키가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest", 
        max_tokens: 1000,
        system: sys,
        messages: [{ role: "user", content: msg }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ message: errData.error?.message || "AI 통신 오류" });
    }

    const data = await response.json();
    const textResponse = data.content[0].text;
    
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(jsonString);

    return res.status(200).json(parsedData);

  } catch (error) {
    return res.status(500).json({ message: error.message || '서버 오류가 발생했습니다.' });
  }
}