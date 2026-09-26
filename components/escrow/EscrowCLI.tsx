import React, { useState } from 'react';

/**
 * Escrow CLI Tool Component
 * Cleaned up and modularized for better maintainability.
 */
export function EscrowCLI() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'Welcome to the Escrow CLI. Type "help" for a list of commands.',
  ]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    let output = '';
    switch (command.toLowerCase()) {
      case 'help':
        output = 'Available commands: help, status, create, refund';
        break;
      case 'status':
        output = 'Escrow #1234: IN PROGRESS';
        break;
      case 'create':
        output = 'Creating new escrow transaction... Done.';
        break;
      case 'refund':
        output = 'Initiating refund for current escrow...';
        break;
      default:
        output = `Command not recognized: ${command}`;
    }

    setHistory([...history, `> ${command}`, output]);
    setInput('');
  };

  return (
    <div className="bg-black text-green-500 font-mono p-4 rounded-md h-64 overflow-y-auto border border-zinc-800">
      {history.map((line, i) => (
        <div key={i} className="mb-1">{line}</div>
      ))}
      <form onSubmit={handleCommand} className="flex mt-2">
        <span className="mr-2">&gt;</span>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          className="bg-transparent outline-none flex-1 text-green-500"
          autoFocus
          placeholder="Enter command..."
        />
      </form>
    </div>
  );
}
