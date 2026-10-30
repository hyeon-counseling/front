"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * 토스페이먼츠 결제위젯 v2 (https://docs.tosspayments.com/sdk/v2/js)
 * 결제수단(카드·카카오페이·네이버페이 등 — 토스 상점관리자 '결제 UI' 설정을 따름)과 약관 동의를 그린다.
 * SDK는 토스 공식 주소에서 한 번만 불러온다. 금액이 바뀌면(쿠폰) setAmount 로 다시 맞춘다.
 * 결제하기 → requestPayment → 토스 결제창 → successUrl?paymentKey&orderId&amount (서버가 금액을 다시 검증하고 승인)
 */
const SDK = "https://js.tosspayments.com/v2/standard";

interface Widgets {
  setAmount(a: { currency: "KRW"; value: number }): Promise<void>;
  renderPaymentMethods(o: { selector: string; variantKey?: string }): Promise<unknown>;
  renderAgreement(o: { selector: string; variantKey?: string }): Promise<unknown>;
  requestPayment(o: { orderId: string; orderName: string; successUrl: string; failUrl: string; customerEmail?: string; customerName?: string }): Promise<void>;
}
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => { widgets(o: { customerKey: string }): Widgets };
  }
}

let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (window.TossPayments) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SDK;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error("sdk"));
      };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
}

export interface TossWidgetHandle {
  requestPayment(o: { orderId: string; orderName: string; customerEmail?: string; customerName?: string }): Promise<void>;
}

export const TossWidget = forwardRef<TossWidgetHandle, { clientKey: string; customerKey: string; amount: number; onReady?: (ready: boolean) => void }>(
  function TossWidget({ clientKey, customerKey, amount, onReady }, ref) {
    const widgets = useRef<Widgets | null>(null);
    const [error, setError] = useState("");
    const firstAmount = useRef(amount);

    useEffect(() => {
      let alive = true;
      loadSdk()
        .then(async () => {
          if (!alive || !window.TossPayments) return;
          const w = window.TossPayments(clientKey).widgets({ customerKey });
          await w.setAmount({ currency: "KRW", value: firstAmount.current });
          await Promise.all([
            w.renderPaymentMethods({ selector: "#toss-payment-methods", variantKey: "DEFAULT" }),
            w.renderAgreement({ selector: "#toss-agreement", variantKey: "AGREEMENT" }),
          ]);
          if (!alive) return;
          widgets.current = w;
          onReady?.(true);
        })
        .catch(() => alive && setError("결제창을 불러오지 못했어요. 새로고침해 주세요."));
      return () => {
        alive = false;
      };
      // 결제위젯은 한 번만 그린다 (금액은 아래에서 맞춤)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientKey, customerKey]);

    useEffect(() => {
      widgets.current?.setAmount({ currency: "KRW", value: amount }).catch(() => undefined);
    }, [amount]);

    useImperativeHandle(ref, () => ({
      async requestPayment(o) {
        if (!widgets.current) throw new Error("not_ready");
        const origin = window.location.origin;
        // 결제창에서 취소(PAY_PROCESS_CANCELED)하면 토스가 orderId를 붙여 주지 않으므로 failUrl에 직접 넣는다
        await widgets.current.requestPayment({ ...o, successUrl: `${origin}/checkout/success`, failUrl: `${origin}/checkout/fail?orderId=${encodeURIComponent(o.orderId)}` });
      },
    }));

    return (
      <div className="mt-8">
        <div id="toss-payment-methods" />
        <div id="toss-agreement" />
        {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
      </div>
    );
  }
);
