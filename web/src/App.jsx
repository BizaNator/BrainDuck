import React, { useState } from 'react';
import { MantineProvider, AppShell, Navbar, Header, Text, Button, Textarea, Table, Code, Alert } from '@mantine/core';
import { format } from 'sql-formatter';
import { IconDatabase, IconPlay, IconX } from '@tabler/icons-react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const executeQuery = async () => {
    try {
      fetch('https://duckdb-handler/executeQuery', {
        method: 'POST',
        body: JSON.stringify({ query: query })
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle messages from the client script
  window.addEventListener('message', (event) => {
    const data = event.data;
    
    if (data.type === 'queryResult') {
      if (data.success) {
        setResults(data.result);
        setError(null);
      } else {
        setError(data.error);
        setResults(null);
      }
    }

    if (data.type === 'toggleUI') {
      // Handle UI visibility
      document.getElementById('app').style.display = data.show ? 'block' : 'none';
    }
  });

  const closeUI = () => {
    fetch('https://duckdb-handler/closeUI', {
      method: 'POST'
    });
  };

  const formatQuery = () => {
    try {
      setQuery(format(query));
    } catch (err) {
      setError('Failed to format query: ' + err.message);
    }
  };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell
        padding="md"
        navbar={
          <Navbar width={{ base: 300 }} p="xs">
            <Text size="xl" weight={700} mb="md">Database Operations</Text>
            <Button 
              leftIcon={<IconPlay size={14} />}
              onClick={executeQuery}
              mb="sm"
              fullWidth
            >
              Execute Query
            </Button>
            <Button 
              variant="light"
              onClick={formatQuery}
              mb="lg"
              fullWidth
            >
              Format Query
            </Button>
          </Navbar>
        }
        header={
          <Header height={60} p="xs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconDatabase size={24} />
              <Text size="xl" weight={700} ml="md">DuckDB Manager</Text>
            </div>
            <Button 
              variant="subtle"
              color="red"
              onClick={closeUI}
              leftIcon={<IconX size={14} />}
            >
              Close
            </Button>
          </Header>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Textarea
            placeholder="Enter your SQL query here..."
            minRows={5}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />

          {error && (
            <Alert title="Error" color="red">
              {error}
            </Alert>
          )}

          {results && Array.isArray(results) && results.length > 0 && (
            <Table>
              <thead>
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value, j) => (
                      <td key={j}>
                        <Code>{JSON.stringify(value)}</Code>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
