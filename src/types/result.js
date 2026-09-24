/** @typedef {'easy' | 'medium' | 'hard'} Difficulty */
/** @typedef {{ type: 'card', id: string, question: string, answer: string, difficulty: Difficulty }} StudyCard */
/** @typedef {{ type: 'chart', id: string, title: string, labels: string[], values: number[] }} StudyChart */
/** @typedef {{ type: 'checklist', id: string, title: string, items: string[] }} StudyChecklist */
/** @typedef {{ topic: string, blocks: Array<StudyCard|StudyChart|StudyChecklist> }} StudyResult */
