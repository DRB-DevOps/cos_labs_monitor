import React, { useState } from 'react';
import './ChatWidget.css';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

// 마크다운 볼드(**텍스트**)를 <b>텍스트</b>로 변환
function renderMarkdown(text: string) {
  // 줄바꿈 먼저 변환
  let html = text.replace(/\n/g, '<br/>');
  // **볼드** 변환
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return html;
}

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { from: 'bot', text: data.answer || data.error || '오류가 발생했습니다.' }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { from: 'bot', text: '서버와 통신 중 오류가 발생했습니다.' }]);
    }
    setLoading(false);
  };

  return (
    <div className={`chat-widget${open ? ' open' : ''}`}> 
      <button className="chat-toggle" onClick={() => setOpen(!open)}>
        💬
      </button>
      {open && (
        <div className="chat-modal">
          <div className="chat-header">
            <span>분석 지원 Agent</span>
            <button className="close-btn" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.from}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />
            ))}
            {loading && <div className="bot">답변 생성 중...</div>}
          </div>
          <div className="chat-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="질문을 입력하세요..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>전송</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget; 