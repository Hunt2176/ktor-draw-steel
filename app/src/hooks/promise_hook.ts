import { useEffect, useState } from "react";

export function usePromise<T>(promise: Promise<T>): UsePromiseResult<T> {
	const [result, setResult] = useState<UsePromiseResult<T>>(() => ({ loading: true }));
	
	useEffect(() => {
		setResult({ loading: true });
		(async () => {
			let pResult: T | undefined;
			let pError: any;
			
			try {
				pResult = await promise;
			} catch (e) {
				pError = e;
			}
			finally {
				setResult({
					value: pResult,
					error: pError,
					loading: false,
				})
			}
		})();
	}, [promise]);
	
	return result;
}

type UsePromiseResult<T> = {
	loading: boolean;
	value?: T;
	error?: any;
}