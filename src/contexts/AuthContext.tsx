'use client';

/**
 * 인증 상태 전역 관리 (React Context)
 *
 * 로그인/로그아웃 상태를 앱 전체에서 공유합니다.
 * - 로그인 시: token과 user 정보를 localStorage에 저장
 * - 로그아웃 시: localStorage에서 제거
 * - 페이지 새로고침 시: localStorage에서 복원 (loading 상태로 깜빡임 방지)
 *
 * 사용법:
 *   const { user, login, logout, loading } = useAuth();
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// 로그인한 사용자 정보 구조
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

// Context가 제공하는 값들의 타입 정의
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  loading: boolean; // 초기 localStorage 복원 완료 전 true
}

// Context 생성 (기본값은 사용되지 않음 — Provider 필수)
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider: layout.tsx에서 전체 앱을 감쌈
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // 초기 복원 완료 전

  // 앱 최초 로드 시 localStorage에서 로그인 상태 복원
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as AuthUser);
      }
    } catch {
      // localStorage 파싱 실패 시 조용히 무시 (로그아웃 상태로 처리)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그인 처리 — token과 user를 상태 + localStorage에 저장
  // useCallback: 함수 참조를 고정해 useEffect 무한 루프 방지
  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  // 로그아웃 처리 — 상태 초기화 + localStorage 제거
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth 훅 — 컴포넌트에서 인증 상태를 쉽게 가져오기 위한 헬퍼
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
