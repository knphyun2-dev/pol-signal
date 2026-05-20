// api/analyze.js (구글 정식 v1 버전 주소로 수정 완료)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  
  // Vercel에 등록해 둔 구글 API 키 값을 가져옵니다.
  const API_KEY = process.env.ANTHROPIC_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ message: '서버에 AI 인증키가 설정되지 않았습니다.' });
  }

  try {
    const combinedPrompt = `${sys}\n\n[분석 대상 데이터]\n${msg}\n\n⚠️ 중요 지시: 부연 설명이나 인사말 없이 오직 위에서 요청한 JSON 양식만 텍스트로 출력하세요.`;

    // 💡 핵심 수정: 주소를 v1beta에서 정식 v1 버전 주소로 변경했습니다.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: combinedPrompt }] 
        }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ message: errData.error?.message || "AI 통신 오류" });
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // 마크다운 기호가 붙어있을 경우를 대비해 깨끗하게 벗겨내고 파싱합니다.
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(jsonString);

    // 웹페이지(index.html)로 결과 반환
    return res.status(200).json(parsedData);

  } catch (error) {
    return res.status(500).json({ message: error.message || '서버 오류가 발생했습니다.' });
  }
}
