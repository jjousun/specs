
import React, { Component } from 'react';
import moment from 'moment';
import classname from 'classname';
import styles from './index.css';

export default class ServiceStats extends Component {
  static propTypes = {
    fullStats: React.PropTypes.bool,
  };

  static defaultProps = {
    fullStats: false,
  };

  static contextTypes = {
    awsConfig: React.PropTypes.object.isRequired,
  };

  renderFullStats() {
    const { service } = this.props;
    const { region } = this.context.awsConfig;
    const clusterName = service.clusterArn.replace(/^arn:[^/]+\//, '');
    const url = `https://${region}.console.aws.amazon.com/ecs/home?region=${region}#/clusters/${clusterName}/services/${service.serviceName}/details`

    return (
      <tbody>
        <tr>
          <th>Cluster</th>
          <td>{clusterName}</td>
        </tr>
        <tr>
          <th>Link</th>
          <td><a href={url} target="_blank">{url}</a></td>
        </tr>
      </tbody>
    )
  }
  
  render() {
    const { service, fullStats } = this.props;
    const { runningCount, desiredCount } = service;
    const { image } = service.task.containerDefinitions[0];
    const updated = moment(service.deployments[0].updatedAt).fromNow();
    const classes = classname({
      [styles.ServiceStats]: true,
      [styles['ServiceStats--left-aligned']]: this.props.left
    });
    return (
      <div className={classes}>
        <table>
          <tbody>
            <tr>
              <th>Image</th>
              <td title={image}>{image}</td>
            </tr>
            <tr>
              <th>Running</th>
              <td>{runningCount} out of {desiredCount}</td>
            </tr>
            <tr>
              <th>Updated</th>
              <td>{updated}</td>
            </tr>
          </tbody>
          {fullStats && this.renderFullStats()}
        </table>
      </div>
    );
  }
};
