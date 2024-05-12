import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BlockBlobClient } from '@azure/storage-blob';
import { Button } from 'react-bootstrap';
import PurgeConfirmation from './PurgeConfirmation';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const portNumber = 5001;
  const mainUrl = `https://localhost:${portNumber}/api/images`;

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [images, setImages] = useState([]);
  const [apiVersion, setApiVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const inputFileRef = useRef();
  var curId = useRef();
  const uploadButtonRef = useRef();
  const purgeButtonRef = useRef();

  useEffect(() => {
    if (portNumber <= 0) {
      setError('You need to set your port number in App.js.');
    }
  }, [portNumber]);

  //Function to reset the buttons and the toast message 
  const resetButtonsAndToast = (success) => {
    uploadButtonRef.current.disabled = false;
    purgeButtonRef.current.disabled = false;
    uploadButtonRef.current.innerText = 'Upload';
    purgeButtonRef.current.innerText = 'Purge Images';

    if (success) {
      toast.success('Image uploaded successfully!');
    } else {
      toast.error('Failed to upload image.');
    }
  };

  const onClickUpload = useCallback(() => {
    setError('');
    if (apiVersion === '1.1' && description.length < 5) {
      setError('Description must be at least 5 characters long.');
      return;
    }

    if (!name || name.length < 3) {
      setError('Enter at least three characters for the title.');
      return;
    }

    const file = inputFileRef.current.files[0];
    if (!file) {
      setError('Choose a file.');
      return;
    }
    fetch(`${mainUrl}/?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Name: name,
        description: apiVersion === '1.1' ? description : '',
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Not OK status code: ${response.status}`);
        }
        return response.json();
      })
      .then((createdImageDetails) => {
        curId = createdImageDetails.id;
        const file = inputFileRef.current.files[0];
        const blockBlobClient = new BlockBlobClient(
          createdImageDetails.uploadUrl
        );
        return blockBlobClient.uploadData(file);
      })
      .then(() => {
        return fetch(`${mainUrl}/${curId}/uploadComplete/?api-version=${apiVersion}`, {
          method: 'PUT',
        });
      })
      .then((uploadCompleteResult) => uploadCompleteResult.json())
      .then((uploadCompleteJson) => {
        setImages([...images, uploadCompleteJson]);
        resetButtonsAndToast(true);
      })
      .catch((error) => {
        setError(`Failed to upload image: ${error.message}`);
        resetButtonsAndToast(false);
      });
  }, [mainUrl, name, description, apiVersion, images]);

  useEffect(() => {
    if (!mainUrl || portNumber <= 0) {
      return;
    }

    fetch(`${mainUrl}/?api-version=${apiVersion}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Not OK status code: ${response.status}`);
        }
        return response.json();
      })
      .then((responseJson) => {
        setImages(responseJson);
      })
      .catch((error) => {
        setError(`Failed to load images on start: ${error.message}`);
      });
  }, [mainUrl, portNumber, apiVersion]);

  const onClickPurge = useCallback(() => {
    setShowConfirmation(true);
  }, []);

  const handlePurgeConfirmed = () => {
    setShowConfirmation(false);
    fetch(`${mainUrl}/?api-version=${apiVersion}`, {
      method: 'DELETE',
    })
      .then((result) => {
        if (result.ok) {
          setImages([]);
        }
      })
      .catch((error) => {
        setError(`Failed to purge images: ${error.message}`);
      });
  };

  const handlePurgeCancelled = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="App">
      <div className="nameContainer">
        Name: <input value={name} onChange={(e) => setName(e.target.value)} type="text" />
        <input ref={inputFileRef} type="file" accept="image/*" />
        <ToastContainer />
      </div>

      <div className="version-buttons">
        <button
          onClick={() => setApiVersion('1.0')}
          className={apiVersion === '1.0' ? 'selected' : ''}
        >
          Version 1.0
        </button>
        <button
          onClick={() => setApiVersion('1.1')}
          className={apiVersion === '1.1' ? 'selected' : ''}
        >
          Version 1.1
        </button>
      </div>

      {apiVersion === '1.1' && (
        <div>
          <label>Description: </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      )}

      <div className="controlsContainer">
        <Button ref={uploadButtonRef} onClick={onClickUpload}>
          Upload
        </Button>
        <Button ref={purgeButtonRef} onClick={onClickPurge}>
          Purge Images
        </Button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="imagesContainer">
        {images.map((image) => (
          <div key={image.id} className="imageContainer">
            <img
              src={`${mainUrl}/${image.id}/?api-version=${apiVersion}`}
              alt={image.Name}
            />
            {apiVersion === '1.1' && (
              <div className="descriptionText">{image.description}</div>
            )}
          </div>
        ))}
      </div>

      {showConfirmation && (
        <PurgeConfirmation onConfirm={handlePurgeConfirmed} onCancel={handlePurgeCancelled} />
      )}
    </div>
  );
}

export default App;
