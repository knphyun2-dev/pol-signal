// api/analyze.js (버전: 무적 제미나이 스타트)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 요청만 받습니다.' });
  }

  const { sys, msg } = req.body;
  
  // 🔑 딱 여기 따옴표 사이에만 내 진짜 구글 API 키(AIzaSy...)를 정확히 붙여넣어 주세요!
  const GOOGLE_KEY = "AIzaSyAKK_58H5DZMT5YIxgOPXAg1ZAJk8580mg";

  try {
    const combinedPrompt = `${sys}\n\n[데이터]\n${msg}\n\n⚠️ 주의: 오직 요청된 JSON 형식으로만 답변하세요.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedPrompt }] }]
      })
    });

    const rawResult = await response.text();

    if (!response.ok) {
      // 🕵️‍♂️ [암행어사 표식] 구글 서버가 뱉은 진짜 에러를 날것 그대로 화면에 보여줍니다.
      return res.status(response.status).json({ 
        message: `🚫 [구글 실시간 에러] 코드: ${response.status} / 내용: ${rawResult} / (마킹: 무적제미나이)` 
      });
    }

    const data = JSON.parse(rawResult);
    const textResponse = data.candidates[0].content.parts[0].text;
    
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(jsonString);

    return res.status(200).json(parsedData);

  } catch (error) {
    // 🕵️‍♂️ [암행어사 표식] 코드 조립 과정에서 터진 에러를 잡아줍니다.
    return res.status(500).json({ 
      message: `💥 [코드 내부 에러] ${error.message} / (마킹: 무적제미나이)` 
    });
  }
}
