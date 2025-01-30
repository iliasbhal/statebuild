import { QueryClient, QueryObserver, UseQueryOptions, QueryObserverResult } from '@tanstack/react-query';
import { Atom, Selector } from '../';
import { Track } from '../core/Track';
import { makeCallableSelector } from '../core/utils/convertToCallback';


type SelectorConfig = { client: QueryClient };
type QuerySelectorConfig = UseQueryOptions & SelectorConfig;

export class QuerySelector<Result> extends Selector<() => Result> {
  options: QuerySelectorConfig;
  results = new Atom<QueryObserverResult<Result>>(null);

  constructor(options: QuerySelectorConfig) {
    const querySelector = () => {
      const result = this.results.get();
      return result;
    }

    super(querySelector as any)
    this.options = options;
  }

  get() {
    if (!this.started) this.start();
    return super.get();
  }

  started = false;
  unsubscribe: ReturnType<QueryObserver['subscribe']> = null;
  private start() {
    if (this.started) return;
    this.started = true;

    const query = new QueryObserver(
      this.options.client,
      this.options.client.defaultQueryOptions({
        ...this.options,

      })
    );

    Track.onActivityChanged(this, (isActive) => {
      if (!isActive) {
        this.stop();
      }
    })

    this.unsubscribe = query.subscribe(((result) => {
      this.results.set(result as any);
    }));
  }

  dispose(): void {
    if (!this.started) return;
    this.started = false;
    this.unsubscribe();
  }

  private stop() {
    this.dispose();
  }

  static fromOptions<O extends QuerySelectorConfig>(options: O) {
    type Return = Awaited<ReturnType<Exclude<O['queryFn'], symbol>>>;
    type Result = QueryObserverResult<Return>;
    const selector = new QuerySelector<Result>(options);
    return makeCallableSelector(selector);
  }
}
