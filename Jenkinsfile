pipeline {
    agent any

    tools {
        jdk 'jdk'
    }

    environment {
        // Sonar
        SONAR_SERVER = 'sonar-server'

        // Docker
        DOCKERHUB_CRED = credentials('docker')
        IMAGE_NAME = "mydocker3692/swiggy-clone"
        IMAGE_TAG  = "${env.BUILD_ID}"

        // Trivy
        TRIVY_REPORT = "trivy_report.txt"
    }

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/yesk993-ops/swiggy-clone.git', branch: 'main'
            }
        }

        stage('Docker Build') {
            steps {
                dir('Swiggy_clone') {
                    sh """
                        docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                    """
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh """
                    trivy image ${IMAGE_NAME}:${IMAGE_TAG} > ${TRIVY_REPORT} || true
                    cat ${TRIVY_REPORT}
                """
            }
        }

        stage('Push Image') {
            steps {
                sh """
                    echo "${DOCKERHUB_CRED_PSW}" | docker login -u "${DOCKERHUB_CRED_USR}" --password-stdin
                    docker push ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        // ===============================
        // DEPLOY BLUE
        // ===============================

        stage('Deploy Blue') {
            steps {
                dir('k8s') {

                    // Inject image tag dynamically
                    sh """
                        sed -i 's|IMAGE_TAG|${IMAGE_TAG}|g' blue-deployment.yaml
                    """

                    sh "kubectl apply -f blue-deployment.yaml"
                    sh "kubectl apply -f service.yaml"

                    // Wait for rollout
                    sh "kubectl rollout status deployment/swiggy-blue --timeout=180s"

                    // Verify pods
                    sh "kubectl get pods -l version=blue"
                }
            }
        }

        stage('Verify Blue Service') {
            steps {
                sh """
                    echo "Checking Blue Service endpoints..."
                    kubectl get svc swiggy-service
                    kubectl get endpoints swiggy-service
                """
            }
        }

        stage('Wait 60 Seconds Before Green') {
            steps {
                echo "Waiting 60 seconds..."
                sleep(time: 60, unit: 'SECONDS')
            }
        }

        // ===============================
        // DEPLOY GREEN
        // ===============================

        stage('Deploy Green') {
            steps {
                dir('k8s') {

                    sh """
                        sed -i 's|IMAGE_TAG|${IMAGE_TAG}|g' green-deployment.yaml
                    """

                    sh "kubectl apply -f green-deployment.yaml"

                    // Wait for green rollout
                    sh "kubectl rollout status deployment/swiggy-green --timeout=180s"

                    sh "kubectl get pods -l version=green"
                }
            }
        }

        stage('Verify Green Pods') {
            steps {
                sh """
                    echo "Verifying Green pods..."
                    kubectl get pods -l version=green
                """
            }
        }

        // ===============================
        // SWITCH TRAFFIC
        // ===============================

        stage('Switch Traffic To Green') {
            steps {
                sh """
                kubectl patch service swiggy-service \
                -p '{"spec":{"selector":{"app":"swiggy","version":"green"}}}'
                """
            }
        }

        stage('Verify Green Service') {
            steps {
                sh """
                    echo "Checking Green service endpoints..."
                    kubectl get svc swiggy-service
                    kubectl get endpoints swiggy-service
                """
            }
        }

        stage('Scale Down Blue') {
            steps {
                sh "kubectl scale deployment swiggy-blue --replicas=0 || true"
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "${TRIVY_REPORT}", allowEmptyArchive: true
        }
        success {
            echo 'Blue-Green Deployment Completed Successfully!'
        }
        failure {
            echo 'Pipeline Failed!'
        }
    }
}
