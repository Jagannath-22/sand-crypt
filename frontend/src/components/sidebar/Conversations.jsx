// frontend/src/components/sidebar/Conversations.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Conversation from './Conversation';
import useGetConversation from '../../hooks/useGetConversation';
import fetchClient from '../../utils/fetchClient';
import { getRandomEmoji } from '../../utils/emoji';

const EMOJI = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const EMOJIS = ["😀","😁","😂","🥹","😊","😎","🤓","🧐","🤠","🥳","🤖","👽","👾","🦄","🐯","🦊","🐶","🐱","🐼","🐨","🐧","🐸","🐵","🐝","🦋"];
  return EMOJIS[hash % EMOJIS.length];
};

const Conversations = () => {
  const { loading, conversations } = useGetConversation();
  const [savedMap, setSavedMap] = useState({});

  useEffect(() => {
    // fetch the user's saved contacts (personal)
    let mounted = true;
    (async () => {
      try {
        const contacts = await fetchClient('/api/contacts', { method: 'GET' });
        if (!mounted) return;
        // contacts: array of { _id: <owner contact id>, contact: {...}, savedName }
        const map = {};
        contacts.forEach(c => {
          // c.contact may be the referenced user
          const id = (c.contact && c.contact._id) || c._id;
          map[id] = c.savedName;
        });
        setSavedMap(map);
      } catch (err) {
        console.warn("Could not fetch saved contacts:", err.message || err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const withEmoji = useMemo(() => conversations.map(c => ({
    ...c,
    _emoji: EMOJI(c._id?.toString?.() || ''),
    savedName: savedMap[c._id?.toString?.()] || null
  })), [conversations, savedMap]);

  return (
    <div className='py-2 flex flex-col overflow-auto'>
      {withEmoji.map((conversation, idx) => (
        <Conversation
          key={conversation._id}
          conversation={conversation}
          emoji={conversation._emoji}
          lastIdx={idx === withEmoji.length - 1}
        />
      ))}
      {loading ? <span className='loading loading-spinner mx-auto'></span> : null}
    </div>
  );
};

export default Conversations;
