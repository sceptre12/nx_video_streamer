import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useSession } from '../components/session';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useSession();
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const { data, error: err } = await login({ username, password });
    if (err || !data) {
      // outcome only; never the form values
      console.log('login outcome: failed');
      setError(err?.message || 'Login failed');
      return;
    }
    console.log('login outcome: success');
    setUser(data);
    navigate('/', { replace: true });
  };

  return (
    <form className="container mx-auto" onSubmit={onSubmit}>
      <h1>Log in</h1>
      <label>
        Username
        <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit">Log in</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export default LoginPage;
