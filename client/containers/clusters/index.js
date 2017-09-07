
import React, { Component } from 'react';
import request from 'superagent';
import Batch from 'batch';
import Loader from 'react-loader';
import Page from '../../components/page';
import ErrorMessage from '../../components/error-message';
import Sidebar from '../../components/sidebar';
import ServiceList from '../../components/service-list';
import ContainerInstanceList from '../../components/container-instance-list';
import Service from '../service';
import ContainerInstance from '../container-instance';

export default class ClustersContainer extends Component {
    static childContextTypes = {
        awsConfig: React.PropTypes.object,
    };

    constructor(props, context) {
        super(props, context)
        this.state = {
            error: null,
            clusters: [],
            services: [],
            containerInstances: [],
            activeClusterArn: null,
            activeServiceArn: null,
            awsConfig: {},
            isGrid: true
        };
        this.toggleGrid = this.toggleGrid.bind(this);
    }

    /**
     * Toggle between grid and list
     */

    toggleGrid() {
        this.setState(prevState => ({
            isGrid: !prevState.isGrid
        }));
    }

    /**
     * Pass through
     */

    getChildContext() {
        return {
            awsConfig: this.state.awsConfig,
        };
    }

    /**
     * Render.
     */

    render() {
        const activeClusterArn = this.getActiveClusterArn();
        const isLoading = !!this.state.error || !!this.state.services.length;
        return (
            <Page toggleGrid={this.toggleGrid}>
              <Sidebar
                  clusters={this.state.clusters}
                  activeClusterArn={activeClusterArn}
                  searchTerm={this.state.searchTerm}
                  setSearchTerm={::this.setSearchTerm}
                  selectCluster={::this.setActiveCluster}
                  onRefresh={::this.fetchData}
              />

              <Loader loaded={isLoading} color="#3cc76a">
                  {this.renderError()}
                <ServiceList
                    services={this.state.services}
                    searchTerm={this.state.searchTerm}
                    activeClusterArn={activeClusterArn}
                    isGrid={this.state.isGrid}/>
                <ContainerInstanceList
                    containerInstances={this.state.containerInstances}
                    activeClusterArn={activeClusterArn}
                />
              </Loader>
                {this.renderServiceSheet()}
                {this.renderContainerInstanceSheet()}
            </Page>
        )
    }

    /**
     * Get the active cluster ARN.
     */

    getActiveClusterArn() {
        if (this.state.activeClusterArn) {
            return this.state.activeClusterArn;
        }

        const clusterName = this.props.params.clusterName;
        const cluster = this.findCluster(clusterName);
        // TODO: if no matching cluster, show an error
        return cluster && cluster.clusterArn;
    }

    /**
     * Set the current search term.
     */

    setSearchTerm(str) {
        this.setState({ searchTerm: str });
    }

    /**
     * Set the active cluster ARN.
     */

    setActiveCluster(cluster) {
        this.setState({
            activeClusterArn: cluster && cluster.clusterArn
        });
    }

    /**
     * Render the service sheet.
     */

    renderServiceSheet() {
        const clusterName = this.props.params.clusterName;
        const serviceName = this.props.params.serviceName;
        if (!serviceName) return null;
        const service = this.findService(clusterName, serviceName);
        if (!service) return null;
        // TODO: if no matching service is found, show an error
        const cluster = this.findCluster(clusterName);
        return <Service service={service} cluster={cluster} />
    }

    /**
     * Render the service sheet.
     */

    renderContainerInstanceSheet() {
        const clusterName = this.props.params.clusterName;
        const instanceArn = this.props.params.instanceArn;
        if (!instanceArn) return null;
        const containerInstance = this.findContainerInstance(clusterName, instanceArn);
        if (!containerInstance) return null;
        // TODO: if no matching container instance is found, show an error
        const cluster = this.findCluster(clusterName);
        return <ContainerInstance containerInstance={containerInstance} cluster={cluster} />
    }

    /**
     * Render the error.
     */

    renderError() {
        return this.state.error
            ? <ErrorMessage error={this.state.error} />
            : null;
    }

    /**
     * Get cluster by its `name`.
     */

    findCluster(name) {
        return this.state.clusters.find((cluster) => {
            return cluster.clusterName == name;
        });
    }

    /**
     * Get service by its `clusterName` and `serviceName`.
     */

    findService(clusterName, serviceName) {
        const cluster = this.findCluster(clusterName);
        if (!cluster) {
            return;
        }

        return this.state.services.find((service) => {
            return service.clusterArn === cluster.clusterArn &&
                service.serviceName === serviceName;
        });
    }

    /**
     * Get container instance by its `clusterName` and `containerInstanceArn`.
     */

    findContainerInstance(clusterName, containerInstanceArn) {
        const cluster = this.findCluster(clusterName);
        if (!cluster) {
            return;
        }

        return this.state.containerInstances.find((ci) => {
            return ci.clusterArn === cluster.clusterArn && (
                ci.containerInstanceArn === containerInstanceArn ||
                ci.containerInstanceArn.endsWith(`:container-instance/${containerInstanceArn}`)
            );
        });
    }

    /**
     * When component mounts, fetch data
     */

    componentDidMount() {
        this.fetchData();
    }

    /**
     * Fetch data.
     */

    fetchData() {
        // Reset data sets
        this.setState({
            clusters: [],
            services: [],
            containerInstances: [],
        });

        request
            .get('/api/clusters')
            .end(function(err, res) {
                if (err) {
                    return this.setState({ error: err.message });
                }

                const clusters = res.body;
                this.setState({ clusters });

                for (let i = 0; i < clusters.length; i++) {
                    this.fetchServices(clusters[i]);
                }
            }.bind(this));

        request
            .get('/api/aws-config')
            .end((err, res) => {
                if (err) {
                    return this.setState({ error: err.message });
                }

                const awsConfig = res.body;
                this.setState({ awsConfig });
            });
    }

    /**
     * Fetch services for the given `cluster`.
     */

    fetchServices(cluster) {
        request
            .get(`/api/clusters/${cluster.clusterName}`)
            .end(function(err, res) {
                if (err) {
                    err = err || new Error(`unable to fetch information on ${cluster.clusterName} (${res.status})`);
                    return this.setState({ error: err.message });
                }

                const { services, containerInstances } = this.state;

                let sortedServices = services.concat(res.body.services);
                // sort services by serviceName
                sortedServices.sort((a, b) => {
                    const nameA = a.serviceName.toUpperCase();
                    const nameB = b.serviceName.toUpperCase();

                    if (nameA == nameB) {
                        return 0;
                    }
                    return nameA < nameB ? -1 : 1;
                });

                this.setState({
                    services: sortedServices,
                    containerInstances: containerInstances.concat(res.body.containerInstances),
                });
            }.bind(this));
    }
};