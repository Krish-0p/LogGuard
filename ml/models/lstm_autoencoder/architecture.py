import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np

def build_lstm_autoencoder(sequence_length=30, n_features=3):
    """
    LSTM Autoencoder for sequence anomaly detection.
    Compressed bottleneck size: 16 units.
    """
    # ENCODER
    encoder_input = keras.Input(shape=(sequence_length, n_features))
    x = layers.LSTM(64, return_sequences=True)(encoder_input)
    x = layers.LSTM(16, return_sequences=False)(x) # Bottleneck
    
    # DECODER
    x = layers.RepeatVector(sequence_length)(x)
    x = layers.LSTM(16, return_sequences=True)(x)
    x = layers.LSTM(64, return_sequences=True)(x)
    
    # Output layer tries to reconstruct the input features
    output = layers.TimeDistributed(layers.Dense(n_features))(x)
    
    model = keras.Model(inputs=encoder_input, outputs=output)
    model.compile(optimizer='adam', loss='mse')
    return model

def get_reconstruction_error(model, X_sequences):
    """Calculates how 'bad' the reconstruction was (MSE)."""
    predictions = model.predict(X_sequences)
    mse = np.mean(np.power(X_sequences - predictions, 2), axis=(1, 2))
    return mse