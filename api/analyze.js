// api/analyze.js (구글 strict JSON 규격 적용 버전)
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: msg }] }],
        // 💡 핵심 수정: 대문자를 없애고 구글 공식 규격인 언더바(_) 형태로 전면 교체했습니다.
        system_instruction: { parts: [{ text: sys }] },
        generation_config: {
          response_mime_type: "application/json" 
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
