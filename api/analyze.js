// api/analyze.js (Vercel 환경변수 버그 우회 및 다이렉트 키 장착 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 요청입니다.' });
  }

  const { sys, msg } = req.body;
  
  // 🔑 Vercel 대시보드 대신, 여기에 내 구글 API 키를 직접 적어줍니다!
  // ★ 중요: 앞뒤 따옴표 사이에 구글 AI 스튜디오에서 복사한 AIzaSy... 키를 넣으세요.
  // 이 파일은 서버 내부 비밀 파일이라 외부 사용자가 절대로 코드를 훔쳐볼 수 없습니다.
  const API_KEY = "AIzaSyAKK_58H5DZMT5YIxgOPXAg1ZAJk8580mg"; 

  if (API_KEY.includes("AIzaSyAKK_58H5DZMT5YIxgOPXAg1ZAJk8580mg") || !API_KEY.startsWith("AIzaSyAKK")) {
    return res.status(500).json({ message: '🔐 [서버 에러] 코드 내부의 API_KEY 칸에 본인의 진짜 구글 키(AIzaSy...)를 올바르게 입력해주세요.' });
  }

  try {
    const combinedPrompt = `${sys}\n\n[분석 대상 데이터]\n${msg}\n\n⚠️ 중요 지시: 부연 설명 없이 오직 JSON 양식만 텍스트로 출력하세요.`;

    // 가장 확실하고 안정적인 v1beta 주소로 고정하여 호출합니다.
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
    const textResponse = data.candidates[0].content.parts[0].text;
    
    try {
      const jsonString = textResponse.replace(/```json|```/g, "").trim();
      const parsedData = JSON.parse(jsonString);
      return res.status(200).json(parsedData);
    } catch (jsonErr) {
      return res.status(500).json({ message: `🧩 [JSON 조립 에러] AI 답변을 매칭하는 데 실패했습니다.` });
    }

  } catch (error) {
    return res.status(500).json({ message: `💥 [시스템 오류] ${error.message}` });
  }
}
