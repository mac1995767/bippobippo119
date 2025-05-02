import React, { useState } from "react";

const OperatingStatus = ({ schedule }) => {
  const [showDetails, setShowDetails] = useState(false);

  // 디버깅을 위한 콘솔 로그

  // schedule 정보가 없으면 드롭다운 없이 메시지만 표시
  if (!schedule) {
    return (
      <div className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-500">
        영업시간 정보 없음
      </div>
    );
  }

  // 요일 관련 변수 (날짜는 영어로 관리하고, 표시 시 한글로 변환)
  const dayOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayKoreanMap = {
    Sunday: "일요일",
    Monday: "월요일",
    Tuesday: "화요일",
    Wednesday: "수요일",
    Thursday: "목요일",
    Friday: "금요일",
    Saturday: "토요일",
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = dayOfWeek[now.getDay()];

  // 문자열을 분 단위 숫자로 변환 (예: "0900" → 540)
  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === "-") return null;
    // 숫자형이면 문자열로 변환
    const strTime = String(timeStr);
    // 3자리 시간을 4자리로 변환 (예: 930 -> 0930)
    const paddedTime = strTime.padStart(4, "0");
    const hour = parseInt(paddedTime.slice(0, 2), 10);
    const minute = parseInt(paddedTime.slice(2, 4), 10);
    return hour * 60 + minute;
  };

  // 숫자형/문자열 시간을 "HH:MM" 형식으로 포맷팅
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "-") return "-";
    // 숫자형이면 문자열로 변환
    const strTime = String(timeStr);
    // 3자리 시간을 4자리로 변환 (예: 930 -> 0930)
    const paddedTime = strTime.padStart(4, "0");
    return `${paddedTime.slice(0, 2)}:${paddedTime.slice(2, 4)}`;
  };

  const nowInMinutes = currentHour * 60 + currentMinute;
  
  // 현재 요일에 맞는 시작/종료 시간 가져오기
  const getTodaySchedule = () => {
    const dayMap = {
      Monday: { start: "trmtMonStart", end: "trmtMonEnd" },
      Tuesday: { start: "trmtTueStart", end: "trmtTueEnd" },
      Wednesday: { start: "trmtWedStart", end: "trmtWedEnd" },
      Thursday: { start: "trmtThuStart", end: "trmtThuEnd" },
      Friday: { start: "trmtFriStart", end: "trmtFriEnd" },
      Saturday: { start: "trmtSatStart", end: "trmtSatEnd" },
      Sunday: { start: null, end: null }
    };

    const daySchedule = dayMap[today];
    if (!daySchedule) return { openTime: null, closeTime: null };

    return {
      openTime: schedule[daySchedule.start],
      closeTime: schedule[daySchedule.end]
    };
  };

  const todaySchedule = getTodaySchedule();
  const openTime = timeToMinutes(todaySchedule.openTime);
  const closeTime = timeToMinutes(todaySchedule.closeTime);

  // 브레이크타임 파싱
  let lunchStart = null,
    lunchEnd = null;
  if (schedule.lunchWeek) {
    const lunchTimes = schedule.lunchWeek.split("~");
    lunchStart = timeToMinutes(lunchTimes[0]);
    lunchEnd = timeToMinutes(lunchTimes[1]);
  }

  let status = "";
  let statusClass = "";

  if (openTime !== null && closeTime !== null) {
    if (nowInMinutes >= openTime && nowInMinutes < closeTime) {
      if (
        lunchStart !== null &&
        lunchEnd !== null &&
        nowInMinutes >= lunchStart &&
        nowInMinutes < lunchEnd
      ) {
        status = "브레이크타임 🍽️";
        statusClass = "bg-yellow-100 text-yellow-600";
      } else {
        status = "영업 중 ✅";
        statusClass = "bg-green-100 text-green-600";
      }
    } else {
      status = "영업 종료 ❌";
      statusClass = "bg-red-100 text-red-600";
    }
  } else {
    status = "알수 없음";
    statusClass = "bg-blue-100 text-blue-600";
  }

  return (
    <div>
      {/* 클릭 시 showDetails 상태 토글 */}
      <div
        className={`px-3 py-1 rounded-md text-sm inline-block cursor-pointer ${statusClass} flex items-center`}
        onClick={() => setShowDetails((prev) => !prev)}
      >
        <span>{status}</span>
        <span
          className="ml-2 transform transition-transform duration-200"
          style={{ transform: showDetails ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </div>
      {/* 드롭다운: 요일별 영업시간 */}
      {showDetails && (
        <div className="mt-2 p-2 border border-gray-200 rounded-md">
          {dayOfWeek.map((day) => {
            const dayMap = {
              Monday: { start: "trmtMonStart", end: "trmtMonEnd" },
              Tuesday: { start: "trmtTueStart", end: "trmtTueEnd" },
              Wednesday: { start: "trmtWedStart", end: "trmtWedEnd" },
              Thursday: { start: "trmtThuStart", end: "trmtThuEnd" },
              Friday: { start: "trmtFriStart", end: "trmtFriEnd" },
              Saturday: { start: "trmtSatStart", end: "trmtSatEnd" },
              Sunday: { start: "trmtSatStart", end: "trmtSatEnd" } // TODO: 일요일 영업 시간 데이터가 아직 없으므로, 현재는 토요일 영업 시간을 기준으로 처리
            };

            const daySchedule = dayMap[day];
            const startTime = daySchedule ? schedule[daySchedule.start] : null;
            const endTime = daySchedule ? schedule[daySchedule.end] : null;

            return (
              <div key={day} className="flex justify-between text-sm py-1">
                <span>{dayKoreanMap[day]}</span>
                {startTime && endTime ? (
                  <span>
                    {formatTime(startTime)} ~ {formatTime(endTime)}
                  </span>
                ) : (
                  <span>휴무</span>
                )}
              </div>
            );
          })}
          {schedule.lunchWeek && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span>점심시간</span>
                <span>{schedule.lunchWeek}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OperatingStatus;