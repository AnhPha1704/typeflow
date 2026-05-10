'use client';

import React from 'react';

interface CharacterDisplayProps {
  characters: string[];
  userInput:  string;
  charRefs:   React.MutableRefObject<(HTMLSpanElement | null)[]>;
}

export function CharacterDisplay({ characters, userInput, charRefs }: CharacterDisplayProps) {
  return (
    <>
      {characters.map((ch, i) => {
        let cls: string;
        if (i < userInput.length) {
          cls = userInput[i] === ch ? 'c-correct' : 'c-wrong';
        } else {
          cls = 'c-untyped';
        }
        return (
          <span
            key={i}
            ref={el => { charRefs.current[i] = el; }}
            className={cls}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
}
