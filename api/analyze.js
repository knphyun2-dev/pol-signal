// api/analyze.js (구글 제미나이 최신 2.5 정식 버전 적용)
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
    // 💡 주소를 v1 정식 버전으로 고치고, 모델을 은퇴하지 않은 최신 'gemini-2.5-flash'로 교체했습니다.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: msg }] }],
        systemInstruction: { parts: [{ text: sys }] },
        generationConfig: {
          responseMimeType: "application/json" 
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ message: errData.error?.message || "AI 통신 오류" });
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    const parsedData = JSON.parse(textResponse.trim());
    return res.status(200).json(parsedData);

  } catch (error) {
    return res.status(500).json({ message: error.message || '서버 오류가 발생했습니다.' });
  }
}
