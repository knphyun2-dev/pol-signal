// api/analyze.js (구글 모델 이름 불일치 완벽 해결 버전)
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
    const combinedPrompt = `${sys}\n\n[분석 대상 데이터]\n${msg}\n\n⚠️ 중요 지시: 부연 설명 없이 오직 JSON 양식만 텍스트로 출력하세요.`;

    // 💡 핵심 해결책: 구글이 지원하는 가용한 모든 제미나이 모델 후보군 리스트를 만듭니다.
    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];

    let response = null;
    let rawResult = '';
    let success = false;
    let lastErrorDetail = '';

    // 후보군 모델들을 하나씩 자동으로 호출해 봅니다.
    for (const model of modelsToTry) {
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: combinedPrompt }] }]
          })
        });

        rawResult = await response.text();

        // 404 에러(모델 없음)가 아니고 정상 작동(ok)하면 루프를 통과합니다.
        if (response.ok) {
          success = true;
          break; 
        } else {
          lastErrorDetail = `모델 [${model}] 실패 - 상태코드: ${response.status} / 내용: ${rawResult}`;
        }
      } catch (err) {
        lastErrorDetail = `모델 [${model}] 통신 오류 - ${err.message}`;
      }
    }

    // 4개 모델이 전부 실패했을 경우에만 에러를 출력합니다.
    if (!success) {
      return res.status(404).json({ message: `🚫 [구글 서버 에러] 사용 가능한 모든 AI 모델 호출에 실패했습니다. 마지막 기록: ${lastErrorDetail}` });
    }

    const data = JSON.parse(rawResult);
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
