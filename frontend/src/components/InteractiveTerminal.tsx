import React, { useState } from 'react';
import { Terminal as TerminalIcon, RotateCcw, Copy, Check } from 'lucide-react';

export const InteractiveTerminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ cmd: string; output: string | React.ReactNode }>>([
    {
      cmd: 'kubectl get pods -n production',
      output: (
        <div className="space-y-1 font-mono text-xs">
          <div className="text-muted-foreground">NAME                        READY   STATUS    RESTARTS   AGE</div>
          <div>api-gateway-7f89d-x92   <span className="text-emerald-400">1/1</span>     <span className="text-emerald-400 font-semibold">Running</span>   0          4d12h</div>
          <div>auth-service-56c4b-m11  <span className="text-emerald-400">1/1</span>     <span className="text-emerald-400 font-semibold">Running</span>   0          4d12h</div>
          <div>payment-worker-89f-q21  <span className="text-emerald-400">1/1</span>     <span className="text-emerald-400 font-semibold">Running</span>   0          12d</div>
        </div>
      )
    }
  ]);
  const [copied, setCopied] = useState(false);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    let response: React.ReactNode = '';

    const lower = trimmed.toLowerCase();
    if (lower === 'help') {
      response = (
        <div className="text-cyan-300 space-y-1">
          <div>Available demo commands:</div>
          <div>  • <span className="font-bold text-emerald-400">docker ps</span> - List active containers</div>
          <div>  • <span className="font-bold text-emerald-400">kubectl get pods</span> - Check Kubernetes pod status</div>
          <div>  • <span className="font-bold text-emerald-400">terraform plan</span> - Inspect infrastructure changes</div>
          <div>  • <span className="font-bold text-emerald-400">clear</span> - Clear terminal screen</div>
        </div>
      );
    } else if (lower.startsWith('docker ps')) {
      response = (
        <div className="space-y-1 text-xs">
          <div className="text-muted-foreground">CONTAINER ID   IMAGE           COMMAND                  PORTS                  NAMES</div>
          <div>c3f89a12b4e5   nginx:alpine    <span className="text-cyan-300">"/docker-entrypoint.…"</span>   0.0.0.0:8080-&gt;80/tcp   web_proxy</div>
          <div>9a8b7c6d5e4f   postgres:16     <span className="text-cyan-300">"docker-entrypoint.s…"</span>   0.0.0.0:5432-&gt;5432/tcp  postgres_db</div>
        </div>
      );
    } else if (lower.startsWith('kubectl')) {
      response = (
        <div className="space-y-1 text-xs text-emerald-400">
          <div>deployment.apps/web-app configured</div>
          <div>service/web-app-svc unchanged</div>
          <div>ingress.networking.k8s.io/web-ingress created</div>
        </div>
      );
    } else if (lower.startsWith('terraform')) {
      response = (
        <div className="space-y-1 text-xs">
          <div className="text-indigo-300">Plan: 2 to add, 0 to change, 0 to destroy.</div>
          <div className="text-emerald-400">  + aws_s3_bucket.prod_logs</div>
          <div className="text-emerald-400">  + aws_iam_role.lambda_exec</div>
        </div>
      );
    } else if (lower === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else {
      response = (
        <div className="text-rose-400">
          bash: {trimmed}: command simulated. Type <span className="underline font-bold text-cyan-300">help</span> for commands.
        </div>
      );
    }

    setHistory(prev => [...prev, { cmd: trimmed, output: response }]);
    setInput('');
  };

  const copyTerminalOutput = () => {
    const textToCopy = history.map(h => `$ ${h.cmd}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-900 shadow-md overflow-hidden font-mono">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <TerminalIcon className="h-3.5 w-3.5 text-cyan-400" />
            live-devops-terminal ~ bash
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            title="Reset Terminal"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={copyTerminalOutput}
            title="Copy Terminal History"
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className="p-4 space-y-3 min-h-[160px] max-h-[220px] overflow-y-auto text-xs leading-relaxed scrollbar-none">
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="text-indigo-400 font-bold">huntdevops@node-01:~$</span>
              <span className="text-foreground font-semibold">{h.cmd}</span>
            </div>
            <div className="pl-4 border-l border-indigo-500/20 text-muted-foreground">
              {h.output}
            </div>
          </div>
        ))}

        {/* Input Line */}
        <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 pt-1">
          <span className="text-indigo-400 font-bold">huntdevops@node-01:~$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type 'help', 'docker ps', or 'kubectl get pods'..."
            className="flex-1 bg-transparent text-xs text-emerald-300 placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </form>
      </div>
    </div>
  );
};
