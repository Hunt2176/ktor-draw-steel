export class Completer<T> {
	constructor() {
		let _resolve: PromiseResolver<T>;
		let _reject: PromiseRejecter<T>;
		
		this.promise = new Promise<T>((resolve, reject) => {
			_resolve = resolve;
			_reject = reject;
		});
		
		this.resolve = _resolve!;
		this.reject = _reject!;
	}
	
	readonly resolve: PromiseResolver<T>;
	readonly reject: PromiseRejecter<T>;
	readonly promise: Promise<T>;
}

type PromiseParams<T> = Parameters<ConstructorParameters<typeof Promise<T>>[0]>;
type PromiseResolver<T> = PromiseParams<T>[0];
type PromiseRejecter<T> = PromiseParams<T>[1];