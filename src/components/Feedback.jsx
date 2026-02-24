export function Feedback({ message, type = 'info' }) {
  if (!message) {
    return null
  }

  return <div className={`feedback feedback--${type}`}>{message}</div>
}
