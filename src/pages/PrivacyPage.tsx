import {
  CONTACT_EMAIL,
  DATA_REGION,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_OFFICER,
  RETENTION_DATE,
  SCHOOL_ADDRESS,
  SCHOOL_NAME,
  SITE_TITLE,
} from '../lib/constants'

const PURPOSES = [
  ['작품 등록', '작품 전시와 관리', '이름(실명 또는 닉네임), 작품 제목, 설명, 작품 링크, 썸네일', '필수 (썸네일은 선택)'],
  ['동의 기록', '동의 사실 확인', '동의 일시, 동의 항목, 동의 문구 버전', '필수'],
  ['초상 포함', '얼굴·신체가 나온 사진 게시', '해당 사진', '선택'],
  ['접속 보안', '접속 코드 오입력 제한', 'IP 주소, 접속 일시', '자동 수집'],
  ['사이트 관리', '지도교사 로그인', '지도교사 이메일', '필수'],
]

const PROCESSORS = [
  ['Supabase, Inc.', '데이터와 파일 저장, 로그인', DATA_REGION, '1항의 항목'],
  ['GitHub, Inc.', '웹사이트 배포', '미국', '접속 기록'],
  ['Google LLC', '후기 설문', '미국 등', '후기 응답 내용'],
]

function InfoTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="privacy-table-wrap" tabIndex={0}>
      <table className="privacy-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="privacy">
      <h1 className="page-title">개인정보 처리방침</h1>
      <p>
        {SCHOOL_NAME}(이하 "학교")은 「개인정보 보호법」에 따라 {SITE_TITLE} 사이트를 이용하는 분의 개인정보를
        보호하고 관련 고충을 처리하기 위해 다음과 같이 처리방침을 공개합니다.
      </p>

      <h2>1. 처리 목적과 항목</h2>
      <InfoTable headers={['구분', '목적', '항목', '필수 여부']} rows={PURPOSES} />

      <h2>2. 보유 기간과 파기</h2>
      <p>
        개인정보는 {RETENTION_DATE}까지 보유합니다. 기간이 끝나거나 삭제 요청이 처리되면 지체 없이 파기합니다. 전자
        파일은 복구할 수 없는 방법으로 삭제합니다.
      </p>

      <h2>3. 제3자 제공</h2>
      <p>
        학교는 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거가 있는 경우는 예외로 합니다. 전시 작품과
        입력한 이름은 사이트에 공개됩니다.
      </p>

      <h2>4. 처리 위탁 및 국외 이전</h2>
      <InfoTable headers={['업체', '내용', '위치', '항목']} rows={PROCESSORS} />
      <p>
        이전 일시와 방법: 서비스 이용 시 네트워크를 통해 전송합니다. 보유 기간: 위 2항과 같습니다. 거부 방법: 등록하지
        않거나 지도교사에게 삭제를 요청할 수 있습니다.
      </p>

      <h2>5. 만 14세 미만 아동</h2>
      <p>
        만 14세 미만 학생의 개인정보는 학교 가정통신문을 통해 법정대리인의 동의를 받은 뒤 처리합니다. 법정대리인은
        아동의 개인정보를 열람, 정정, 삭제, 처리정지하도록 요구할 수 있습니다.
      </p>

      <h2>6. 정보주체의 권리</h2>
      <p>
        정보주체와 법정대리인은 개인정보의 열람, 정정, 삭제, 처리정지를 요구하고 동의를 철회할 수 있습니다. 요청은
        지도교사에게 직접 연락해 주시기 바랍니다.
      </p>

      <h2>7. 안전성 확보 조치</h2>
      <p>접근 권한 제한, 전송 구간 암호화, 접속 코드 해시 저장, 입력 실패 횟수 제한, 관리자 계정 인증을 적용합니다.</p>

      <h2>8. 쿠키 등 자동 수집 장치</h2>
      <p>
        이 사이트는 쿠키를 사용하지 않으며 맞춤형 광고나 행태정보 수집을 하지 않습니다. 업로드와 지도교사 로그인의 세션
        유지에 필요한 정보만 브라우저에 저장합니다. 후기 작성에 쓰는 구글 폼은 외부 서비스로 Google의 정책을 따릅니다.
      </p>

      <h2>9. 개인정보 보호책임자</h2>
      <p>
        책임자: {PRIVACY_OFFICER}
        <br />
        이메일: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        주소: {SCHOOL_ADDRESS}
      </p>

      <h2>10. 권익침해 구제</h2>
      <p>
        개인정보 침해에 대한 상담이나 구제가 필요하면 다음 기관에 문의할 수 있습니다. 개인정보침해신고센터 118, 개인정보
        분쟁조정위원회 1833-6972, 대검찰청 1301, 경찰청 182.
      </p>

      <h2>11. 시행일 및 변경</h2>
      <p>이 방침은 {PRIVACY_EFFECTIVE_DATE}부터 적용합니다. 내용이 바뀌면 이 페이지에 공지합니다.</p>
    </div>
  )
}
