import React, {Component} from 'react';
import moment from 'moment';
import classname from 'classname';
import styles from './index.css';

export default class ContainerInstanceStats extends Component {

  static propTypes = {
    fullStats: React.PropTypes.bool,
  };

  static defaultProps = {
    fullStats: false,
  };

  static contextTypes = {
    awsConfig: React.PropTypes.object.isRequired,
  };

  renderFullStats(container, instanceType, az) {
    const {region} = this.context.awsConfig;
    const {
      containerInstanceArn,
      ec2InstanceId,
      clusterArn,
    } = container;

    const containerInstanceArnId = containerInstanceArn.split(':container-instance/')[1];
    const clusterName = clusterArn.split('cluster/')[1];

    const clusterLink = `https://${region}.console.aws.amazon.com/ecs/home?region=${region}#/clusters/${clusterName}/containerInstances`;
    const ecsLink = `https://${region}.console.aws.amazon.com/ecs/home?region=${region}#/clusters/${clusterName}/containerInstances/${containerInstanceArnId}`;
    const ec2Link = `https://${region}.console.aws.amazon.com/ec2/v2/home?region=${region}#Instances:instanceId=${ec2InstanceId};sort=instanceId`;

    return (
      <tbody>
      <tr>
        <th>Container ARN</th>
        <td><a href={ecsLink} title={containerInstanceArn}>{containerInstanceArnId}</a></td>
      </tr>
      <tr>
        <th>Instance Type</th>
        <td>{instanceType}</td>
      </tr>
      <tr>
        <th>Availability Zone</th>
        <td>{az}</td>
      </tr>
      <tr>
        <th>Cluster</th>
        <td><a href={clusterLink} target="_blank">{clusterName}</a></td>
      </tr>
      <tr>
        <th>EC2 Link</th>
        <td><a href={ec2Link} target="_blank">{ec2Link}</a></td>
      </tr>
      </tbody>
    )
  }

  render() {
    const container = this.props.containerInstance;
    const {
      runningTasksCount,
      pendingTasksCount,
      registeredResources,
      remainingResources,
      attributes,
    } = container;

    const cpuRegistered = registeredResources.find(r => r.name === "CPU");
    const cpuAvailable = remainingResources.find(r => r.name === "CPU");

    const memRegistered = registeredResources.find(r => r.name === "MEMORY");
    const memAvailable = remainingResources.find(r => r.name === "MEMORY");

    const instanceType = attributes.find(a => a.name === 'ecs.instance-type').value;
    const az = attributes.find(a => a.name === 'ecs.availability-zone').value;

    const classes = classname({
      [styles.ContainerInstanceStats]: true,
      [styles['ContainerInstanceStats--left-aligned']]: this.props.left
    });

    const fullStats = this.props.fullStats;

    return (
      <div className={classes}>
        {!fullStats &&
        <div className={styles.ContainerInstanceStatsInfo}>
          <span className="instance-type">{instanceType}</span>
          {' - '}
          <span className="az">{az}</span>
        </div>
        }
        <table>
          <tbody>
          <tr>
            <th>Tasks</th>
            <td>{runningTasksCount}</td>
          </tr>
          <tr>
            <th>CPU</th>
            <td>{cpuRegistered.integerValue - cpuAvailable.integerValue} / {cpuRegistered.integerValue}</td>
          </tr>
          <tr>
            <th>Memory</th>
            <td>{memRegistered.integerValue - memAvailable.integerValue} / {memRegistered.integerValue}</td>
          </tr>
          </tbody>
          {fullStats && this.renderFullStats(container, instanceType, az)}
        </table>
      </div>
    );
  }
};
