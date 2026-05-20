// api/analyze.js (구글 제미나이 무료 버전)
export default async function handler(req, res) {
  // POST 요청만 허용합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  
  // Vercel에 등록할 비밀키입니다. (이름은 기존 그대로 ANTHROPIC_API_KEY를 쓰셔도 무방합니다)
  const API_KEY = process.env.ANTHROPIC_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ message: '서버에 AI 인증키가 설정되지 않았습니다.' });
  }

  try {
    // 구글 제미나이 1.5 Flash 무료 API 호출 주소
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: msg }] }],
        systemInstruction: { parts: [{ text: sys }] },
        generationConfig: {
          responseMimeType: "application/json" // AI에게 처음부터 JSON 형태로 답변하라고 강제 설정
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ message: errData.error?.message || "AI 통신 오류" });
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // 제미나이가 보내준 JSON 문자열을 진짜 오브젝트로 변환
    const parsedData = JSON.parse(textResponse.trim());
    
    // 웹 화면(index.html)으로 최종 배달
    return res.status(200).json(parsedData);

  } catch (error) {
    return res.status(500).json({ message: error.message || '서버 오류가 발생했습니다.' });
  }
}
