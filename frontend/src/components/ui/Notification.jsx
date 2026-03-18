import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';

const Notification = forwardRef(function Notification(_, ref) {
  const [msg, setMsg]     = useState('');
  const [type, setType]   = useState('ok');
  const timerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    show(message, isError = false) {
      setMsg(message);
      setType(isError ? 'error' : 'ok');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMsg(''), 6000);
    }
  }));

  if (!msg) return null;
  return <div className={`ct-notify ${type}`}>{msg}</div>;
});

export default Notification;
