import { useState } from 'react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Palette } from 'lucide-react';
import type { Trade } from '@/types';

interface TradeManagerProps {
  onSelect?: (tradeId: string | null) => void;
}

export function TradeManager({ onSelect }: TradeManagerProps) {
  const { trades, addTrade, updateTrade, deleteTrade } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTradeName, setNewTradeName] = useState('');
  const [newTradeColor, setNewTradeColor] = useState('#3B82F6');

  const handleAddTrade = () => {
    if (!newTradeName.trim()) return;
    const id = addTrade({
      name: newTradeName.trim(),
      color: newTradeColor,
      order: trades.length,
    });
    setNewTradeName('');
    setNewTradeColor('#3B82F6');
  };

  const handleUpdateTrade = (id: string, updates: Partial<Trade>) => {
    updateTrade(id, updates);
    setEditingId(null);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="業種管理"
      >
        <Palette className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">業種マスタ管理</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 新規追加 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">新規業種追加</h3>
          <div className="flex gap-2">
            <Input
              value={newTradeName}
              onChange={(e) => setNewTradeName(e.target.value)}
              placeholder="業種名"
              className="flex-1"
            />
            <input
              type="color"
              value={newTradeColor}
              onChange={(e) => setNewTradeColor(e.target.value)}
              className="w-12 h-10 rounded border"
            />
            <Button onClick={handleAddTrade} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 業種一覧 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">業種一覧</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: trade.color }}
                />
                {editingId === trade.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={trade.name}
                      onChange={(e) => updateTrade(trade.id, { name: e.target.value })}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <input
                      type="color"
                      value={trade.color}
                      onChange={(e) => updateTrade(trade.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border"
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      保存
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{trade.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingId(trade.id)}
                    >
                      <Palette className="w-3 h-3" />
                    </Button>
                    {trades.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => deleteTrade(trade.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
