import React, { useState } from 'react';
import { List, Modal } from '@react95/core';
import { Mmsys120 } from '@react95/icons';
const Synth = ({ onClose }) => {
  return (
    <Modal
      closeModal={onClose}
      style={{ width: '300px', height: '200px' }}
      icon={<Mmsys120 variant="32x32_4"/>}
      title="MySynthesizer.exe"
      defaultPosition={{
        x: Math.floor(window.innerWidth / 2) - 20,
        y: Math.floor(window.innerHeight / 2) - 360,
      }}
      menu={[
        {
          name: 'Options',
          list: (
            <List width="200px">
              <List.Item onClick={onClose}>Close</List.Item>
            </List>
          ),
        },
      ]}
    >
      <h1>Coming soon.</h1>
    </Modal>
  );
};

export default Synth;