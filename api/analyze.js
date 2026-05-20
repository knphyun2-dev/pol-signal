// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  
  // 기존에 Vercel에 등록해 두신 환경변수 값(구글 API키)을 그대로 가져다 씁니다.
  const API_KEY = process.env.ANTHROPIC_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ message: '서버에 AI 인증키가 설정되지 않았습니다.' });
  }

  try {
    // 시스템 지침과 사용자 입력을 하나의 텍스트 본문으로 안전하게 결합
    const combinedPrompt = `${sys}\n\n[분석 대상 데이터]\n${msg}\n\n⚠️ 중요 지시: 부연 설명이나 인사말 없이 오직 위에서 요청한 JSON 양식만 텍스트로 출력하세요.`;

    // 구글 제미나이 1.5 Flash 최신 무료 API 주소 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
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
    
    // AI가 마크다운 블록(```json )을 감싸서 보내더라도 깔끔하게 껍데기를 벗겨내 파싱합니다.
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(jsonString);

    // 웹페이지(index.html)로 완벽한 가공 데이터 반환
    return res.status(200).json(parsedData);

  } catch (error) {
    return res.status(500).json({ message: error.message || '서버 오류가 발생했습니다.' });
  }
}
