import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { ErrorOutlineOutlined, FmdGoodOutlined } from '@mui/icons-material';

export const GoogleMap = ({ address, color = `#3e4396` }) => {
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: 'AIzaSyB7uPXiZmXRVkVwhycyfLixIEwcwcrSSvM',
          version: 'weekly',
          libraries: ['places'],
        });

        const google = await loader.load();

        if (!mapRef.current) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;

            const map = new google.maps.Map(mapRef.current, {
              center: location,
              zoom: 15,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
            });

            new google.maps.Marker({
              position: location,
              map: map,
              title: address,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              },
            });

            setIsLoaded(true);
            setError(null);
          } else {
            setError(`Geocoding failed: ${status}`);
          }
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load Google Maps. Please check your API key.');
      }
    };

    if (address) {
      initMap();
    }
  }, [address, color]);

  if (error) {
    return (
      <Paper elevation={2} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box textAlign="center">
          <ErrorOutlineOutlined size={32} color="#f44336" style={{ marginBottom: 8 }} />
          <Typography variant="body2" color="text.secondary">
            {error.includes('API key') ? (
              <>
                Google Maps API key required
                <br />
                <Typography variant="caption">Add your API key to <code>GoogleMap.jsx</code></Typography>
              </>
            ) : (
              error
            )}
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!address) {
    return (
      <Paper elevation={2} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box textAlign="center">
          <FmdGoodOutlined size={32} color="#9e9e9e" style={{ marginBottom: 8 }} />
          <Typography variant="body2" color="text.secondary">No address provided</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 1,
          }}
        >
          <Box textAlign="center">
            <CircularProgress size={24} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Loading map...</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};
