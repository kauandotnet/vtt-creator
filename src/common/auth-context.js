import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import { makeStyles } from '@material-ui/styles';
import { useApolloClient, gql } from '@apollo/client';
import { LoginUrl } from '../config';
import { Button, Loader } from './index';
import { UnauthorizedError } from '../errors';
import { listenForAuth } from '../services/storage.service';

const useStyles = makeStyles(() => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		alignItems: 'center',
	},
}));

const AuthContext = React.createContext({
	isAuthenticated: () => false,
});

const USER_QUERY = gql`
	query getUser {
		self {
			id
			email
			credit
			unlimitedUsage
		}
	}
`;

AuthProvider.propTypes = {
	children: PropTypes.node.isRequired,
	authError: PropTypes.bool.isRequired,
	onAuthRefresh: PropTypes.func.isRequired,
};

function AuthProvider({ children, authError, onAuthRefresh }) {
	const classes = useStyles();
	const apolloClient = useApolloClient();
	const [isAuthenticated, setIsAuthenticated] = React.useState(false);
	const [user, setUser] = React.useState(false);

	React.useEffect(() => {
		apolloClient.query({ query: USER_QUERY }).then(({ data }) => {
			setIsAuthenticated(true);
			Sentry.setUser(data.self);
			setUser(data.self);
		});
		// TODO: ignore 401 in apollo

		return listenForAuth(() => {
			apolloClient.query({ query: USER_QUERY }).then(({ data }) => {
				setIsAuthenticated(true);
				Sentry.setUser(data.self);
				setUser(data.self);
				onAuthRefresh();
			});
			// TODO: ignore 401 in apollo
		});
	}, [apolloClient, onAuthRefresh]);

	if (authError) {
		return (
			<div className={classes.root}>
				<div>
					<Loader />
					<Button variant="contained" color="primary" href={LoginUrl} target="_blank">
						Please Login
					</Button>
				</div>
			</div>
		);
	}

	return <AuthContext.Provider value={{ isAuthenticated, user }}>{children}</AuthContext.Provider>;
}

export default class AuthErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { authError: false };
		this.handleAuthRefresh = this.handleAuthRefresh.bind(this);
	}

	componentDidCatch(error) {
		if (error instanceof UnauthorizedError) {
			this.setState({ authError: true });
			window.open(LoginUrl);
		} else {
			throw error;
		}
	}

	handleAuthRefresh() {
		this.setState({ authError: false });
	}

	render() {
		const { children } = this.props;
		const { authError } = this.state;
		return (
			<AuthProvider authError={authError} onAuthRefresh={this.handleAuthRefresh}>
				{children}
			</AuthProvider>
		);
	}
}

AuthErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
};

export function useAuth() {
	return React.useContext(AuthContext);
}
