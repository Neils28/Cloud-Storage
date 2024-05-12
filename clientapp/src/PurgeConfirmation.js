import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const PurgeConfirmation = ({ onConfirm, onCancel }) => {
  return (
    <Modal show={true} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to purge the images?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Purge
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PurgeConfirmation;
