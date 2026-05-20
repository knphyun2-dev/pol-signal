// api/analyze.js (에러 추적 기능이 탑재된 초정밀 진단 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  const API_KEY = process.env.ANTHROPIC_API_KEY; 

  // [진단 1] Vercel에 키가 아예 안 들어왔을 때
  if (!API_KEY) {
    return res.status(500).json({ message: '🔐 [서버 에러] Vercel 환경변수(Value)에 구글 API 키가 등록되지 않았거나 반영되지 않았습니다.' });
  }

  try {
    const combinedPrompt = `${sys}\n\n[분석 대상 데이터]\n${msg}\n\n⚠️ 중요 지시: 부연 설명 없이 오직 JSON 양식만 텍스트로 출력하세요.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedPrompt }] }]
      })
    });

    // 구글 서버가 보낸 raw 텍스트를 먼저 받습니다 (에러 분석용)
    const rawResult = await response.text(); 

    // [진단 2] 구글 AI 서버 자체에서 에러를 뱉었을 때
    if (!response.ok) {
      return res.status(response.status).json({ message: `🚫 [구글 서버 에러] 상태코드: ${response.status} / 내용: ${rawResult}` });
    }

    const data = JSON.annotation ? JSON.parse(rawResult) : JSON.parse(rawResult);
    
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      return res.status(500).json({ message: `❓ [데이터 구조 에러] 구글 응답 형식이 예상과 다릅니다: ${rawResult}` });
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    
    // [진단 3] AI 답변을 웹 화면용 JSON으로 조립하다가 깨졌을 때
    try {
      const jsonString = textResponse.replace(/```json|```/g, "").trim();
      const parsedData = JSON.parse(jsonString);
      return res.status(200).json(parsedData);
    } catch (jsonErr) {
      return res.status(500).json({ message: `🧩 [JSON 조립 에러] AI가 순수한 데이터 양식 외에 다른 말을 섞었습니다. AI 답변 내용: ${textResponse}` });
    }

  } catch (error) {
    // [진단 4] 네트워크 단절 등 예상치 못한 시스템 예외가 터졌을 때
    return res.status(500).json({ message: `💥 [시스템 시스템 오류] ${error.message}` });
  }
}
