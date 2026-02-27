import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../lib/translations';
import { groupsAPI, messagesAPI, friendsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageCircle, Plus, Send, ArrowLeft, Users } from 'lucide-react';
import MobileNav from '../components/MobileNav';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user, language } = useAuth();
  const { t } = useTranslation(language);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages(selectedGroup.id);
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.list();
      setGroups(response.data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await friendsAPI.list();
      setFriends(response.data.friends);
    } catch (error) {
      console.error('Failed to load friends');
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      const response = await messagesAPI.get(groupId);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await groupsAPI.create(newGroupName, selectedMembers);
      toast.success(language === 'hi' ? 'समूह बनाया गया' : 'Group created');
      setDialogOpen(false);
      setNewGroupName('');
      setSelectedMembers([]);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    setSendingMessage(true);
    try {
      const response = await messagesAPI.send(selectedGroup.id, newMessage);
      setMessages(prev => [...prev, { ...response.data, created_at: new Date().toISOString(), is_mine: true }]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleMember = (friendId) => {
    setSelectedMembers(prev => prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]);
  };

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
        <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedGroup(null)} className="rounded-full" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-slate-900">{selectedGroup.name}</h1>
              <p className="text-sm text-slate-500">{selectedGroup.member_count} {language === 'hi' ? 'सदस्य' : 'members'}</p>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 max-w-lg mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t('noMessages')}</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${msg.is_mine ? 'bg-indigo-600 text-white' : 'bg-white'} rounded-2xl p-3 shadow-sm`}>
                    {!msg.is_mine && <p className="text-xs text-indigo-600 font-medium mb-1">{msg.sender_name}</p>}
                    <p className={msg.is_mine ? 'text-white' : 'text-slate-900'}>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.is_mine ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
          <div className="max-w-lg mx-auto flex gap-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t('typeMessage')} className="flex-1 h-12 rounded-full bg-slate-50 border-transparent px-5" data-testid="message-input" />
            <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-full p-0" data-testid="send-btn">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] main-content">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 font-['Manrope']">{t('groups')}</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 px-4" data-testid="create-group-btn">
                <Plus className="w-5 h-5 mr-2" />{t('createGroup')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle>{t('createGroup')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder={t('groupName')} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-transparent" data-testid="group-name-input" />
                {friends.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">{t('members')}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {friends.map((friend) => (
                        <button key={friend.id} onClick={() => toggleMember(friend.id)} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${selectedMembers.includes(friend.id) ? 'bg-indigo-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
                          <Avatar className="w-8 h-8"><AvatarImage src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} /><AvatarFallback>{friend.name?.charAt(0)}</AvatarFallback></Avatar>
                          <span className="text-sm font-medium">{friend.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">{t('createGroup')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <h2 className="text-lg font-bold text-slate-900 font-['Manrope'] mb-4">{t('myGroups')} ({groups.length})</h2>
        {loading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group, index) => (
              <motion.div key={group.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="border-0 shadow-sm rounded-2xl cursor-pointer card-hover" onClick={() => setSelectedGroup(group)} data-testid={`group-${group.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{group.name}</p>
                      <p className="text-sm text-slate-500">{group.member_count} {language === 'hi' ? 'सदस्य' : 'members'}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm rounded-2xl"><CardContent className="p-8 text-center"><MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">{t('noGroups')}</p></CardContent></Card>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
