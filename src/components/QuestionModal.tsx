import { Show } from 'solid-js';

export type QuestionModalProps = {
  show: boolean;
  question: any;
  category: any;
  timer: number;
  submitAnswer: (index: number) => void;
  submitDirectAnswer: () => void;
  answerType: 'multiple' | 'direct';
  setAnswerType: (value: 'multiple' | 'direct') => void;
  directAnswer: string;
  setDirectAnswer: (value: string) => void;
  selectedAnswer: number | null;
  answerSubmitted: boolean;
  answerResult: any;
};

export function QuestionModal(props: QuestionModalProps) {
  return (
    <Show when={props.show}>
      <div class="modal-overlay">
        <div class="modal question-modal">
          <div class="question-header" style={`background-color: ${props.category?.color}`}>
            <span class="category-emoji">{props.category?.emoji}</span>
            <span class="category-name">{props.category?.name}</span>
          </div>

          <div class="timer-section">
            <div class={`timer ${props.timer <= 5 ? 'timer-warning' : ''}`}>
              <span>{props.timer}</span>s
            </div>
            <div class="timer-bar">
              <div class="timer-fill" style={`width: ${props.timer / 20 * 100}%`}></div>
            </div>
          </div>

          <div class="question-text">{props.question?.description}</div>

          <div class="answer-section">
            <div class="answer-type-toggle">
              <button
                class={`btn btn-toggle ${props.answerType === 'multiple' ? 'active' : ''}`}
                onClick={() => props.setAnswerType('multiple')}
              >
                📋 Multiple Choice (+1km)
              </button>
              <button
                class={`btn btn-toggle ${props.answerType === 'direct' ? 'active' : ''}`}
                onClick={() => props.setAnswerType('direct')}
              >
                ✍️ Direct Answer (+2km)
              </button>
            </div>

            <Show when={props.answerType === 'multiple'}>
              <div class="options-grid">
                {props.question?.options?.map((option: string, index: number) => (
                  <button 
                    class={`option-btn ${props.selectedAnswer === index ? 'selected' : ''}`}
                    disabled={props.answerSubmitted}
                    onClick={() => props.submitAnswer(index)}
                  >
                    <span class="option-letter">{['A', 'B', 'C'][index]}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </Show>

            <Show when={props.answerType === 'direct'}>
              <div class="direct-answer-section">
                <p class="hint">Type your answer (exact match required):</p>
                <input
                  type="text"
                  class="input-field"
                  placeholder="Your answer..."
                  disabled={props.answerSubmitted}
                  value={props.directAnswer}
                  onInput={(e) => props.setDirectAnswer(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') props.submitDirectAnswer();
                  }}
                />
                <button
                  onClick={props.submitDirectAnswer}
                  class="btn btn-primary"
                  disabled={!props.directAnswer || props.answerSubmitted}
                >
                  Submit Answer
                </button>
              </div>
            </Show>
          </div>

          <Show when={props.answerResult}>
            <div class={`answer-feedback ${props.answerResult?.correct ? 'correct' : 'wrong'}`}>
              <span>{props.answerResult?.message}</span>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}