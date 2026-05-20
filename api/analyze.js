// api/analyze.js (v1beta 주소 복구 + 초심플 안전 호출 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  const API_KEY = process.env.ANTHROPIC_API_KEY; 

  if (!API_KEY) {
    return res.status(500).json({ message: '🔐 [서버 에러] Vercel 환경변수에 구글 API 키가 등록되지 않았습니다.' });
  }

  try {
    // 시스템 지침과 상황 데이터를 하나로 안전하게 결합합니다.
    const combinedPrompt = `${sys}\n\n[분석 대상 데이터]\n${msg}\n\n⚠️ 중요 지시: 부연 설명 없이 오직 JSON 양식만 텍스트로 출력하세요.`;

    // 💡 핵심 해결: 주소는 확실하게 지원되는 v1beta로 되돌리고, 
    // 에러를 유발하던 부가 옵션들을 싹 빼서 가장 안전한 'contents'만 전달합니다.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedPrompt }] }]
      })
    });

    const rawResult = await response.text(); 

    if (!response.ok) {
      return res.status(response.status).json({ message: `🚫 [구글 서버 에러] 상태코드: ${response.status} / 내용: ${rawResult}` });
    }

    const data = JSON.parse(rawResult);
    
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      return res.status(500).json({ message: `❓ [데이터 구조 에러] 구글 응답 형식이 예상과 다릅니다.` });
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    
    try {
      const jsonString = textResponse.replace(/```json|```/g, "").trim();
      const parsedData = JSON.parse(jsonString);
      return res.status(200).json(parsedData);
    } catch (jsonErr) {
      return res.status(500).json({ message: `🧩 [JSON 조립 에러] AI가 순수한 JSON 외에 다른 말을 섞었습니다.` });
    }

  } catch (error) {
    return res.status(500).json({ message: `💥 [시스템 오류] ${error.message}` });
  }
}
