declare module 'debug' {
  function debug(namespace: string): debug.Debugger;
  
  namespace debug {
    interface Debugger {
      (formatter: any, ...args: any[]): void;
      enabled: boolean;
      namespace: string;
      extend: (namespace: string) => Debugger;
      log: (...args: any[]) => void;
      color: string;
    }
    
    function enable(namespaces: string): void;
    function disable(): string;
    function enabled(namespace: string): boolean;
    function formatArgs(args: any[]): void;
    function log(...args: any[]): void;
    function useColors(): boolean;
    function destroy(): boolean;
    
    const colors: number[];
    const names: RegExp[];
    const skips: RegExp[];
    
    const formatters: {
      [formatter: string]: (v: any) => string;
    };
  }
  
  export = debug;
}
