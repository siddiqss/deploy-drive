

const MAX_LENGTH = 6

export default function generateId() {
  let generatedId = "";
  const string = "1234567890qewrkjwerensfwecmpqwoejkjfmnxzcweiu";
  for (let i = 0; i < MAX_LENGTH; i++) {
    generatedId += string[Math.floor(Math.random() * string.length)];
  }
  return generatedId;
}
