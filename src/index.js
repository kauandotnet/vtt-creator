import * as React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/client';
import apolloClient from './ApolloClient';
import MuiThemeProvider from '@material-ui/styles/ThemeProvider';
import CssBaseline from '@material-ui/core/CssBaseline';
import * as Sentry from '@sentry/browser';
import theme from './mui-theme';
import Router from './router.component';
import { ToastProvider, ErrorBoundary, AuthProvider } from './common';
import { SentryDSN } from './config';

function AppWrapper() {
	return (
		<ApolloProvider client={apolloClient}>
			<MuiThemeProvider theme={theme}>
				<CssBaseline />
				<ErrorBoundary>
					<AuthProvider>
						<ToastProvider>
							<Router />
						</ToastProvider>
					</AuthProvider>
				</ErrorBoundary>
			</MuiThemeProvider>
		</ApolloProvider>
	);
}

Sentry.init({ dsn: SentryDSN });

const root = document.getElementById('react-root');
if (!root) throw new Error('Could not find react dom root');
ReactDOM.render(<AppWrapper />, root);
