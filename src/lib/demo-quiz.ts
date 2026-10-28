export const demoQuestions = [
  {
    topic: "Кэширование",
    roadmap: "System Design",
    question: "Для чего в распределённой системе чаще всего используют кэш?",
    choices: [
      "Чтобы быстрее получать часто используемые данные",
      "Чтобы полностью заменить основную базу данных",
      "Чтобы шифровать трафик между сервисами",
      "Чтобы распределять запросы между серверами",
    ],
    correct: 0,
    explanation: "Кэш хранит часто запрашиваемые данные ближе к приложению и уменьшает нагрузку на источник.",
  },
  {
    topic: "Базы данных",
    roadmap: "System Design",
    question: "Какой индекс обычно помогает ускорить поиск строки по конкретному полю?",
    choices: ["Архивный", "Визуальный", "B-tree", "Сетевой"],
    correct: 2,
    explanation: "B-tree индекс помогает быстро находить значения и диапазоны без полного просмотра таблицы.",
  },
  {
    topic: "Кэширование",
    roadmap: "System Design",
    question: "Что означает истечение TTL у записи в кэше?",
    choices: ["Данные шифруются", "Запись считается устаревшей", "База данных удаляется", "Запрос отменяется"],
    correct: 1,
    explanation: "TTL задаёт срок жизни записи. После его истечения данные нужно получить заново.",
  },
  {
    topic: "Базы данных",
    roadmap: "System Design",
    question: "Для чего нужна реплика базы данных?",
    choices: ["Для стилизации интерфейса", "Для хранения CSS", "Для копии данных и распределения чтения", "Для генерации паролей"],
    correct: 2,
    explanation: "Реплика содержит копию данных и может обслуживать запросы чтения или помогать при отказе основного узла.",
  },
  {
    topic: "FastAPI",
    roadmap: "Python Backend",
    question: "Что обычно делает Pydantic-модель в FastAPI?",
    choices: ["Рисует граф", "Запускает Redis", "Компилирует CSS", "Проверяет и описывает данные запроса"],
    correct: 3,
    explanation: "Pydantic описывает структуру данных и проверяет входные значения.",
  },
] as const;

export const sampleAnswers = [0, 2, 1, 0, 3];

export function parseDemoAnswers(value: string | null): number[] | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== demoQuestions.length || parts.some((part) => !/^\d+$/.test(part))) return null;
  const answers = parts.map(Number);
  if (answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= demoQuestions[index].choices.length)) return null;
  return answers;
}
